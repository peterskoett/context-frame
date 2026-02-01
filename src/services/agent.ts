import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { glob } from 'glob';
import { spawnSync } from 'child_process';
import type { CopilotClient, Tool } from '@github/copilot-sdk';
import { scanRepository } from './scanner';
import { calculateScore, ScoreResult } from './scorer';
import { CopilotClientManager } from './copilot-client';

export type AgentMode = 'default' | 'improve';

interface AgentSummary {
  scanScore: ScoreResult;
  basePath: string;
  analysisText: string;
}

const DEFAULT_GLOB_IGNORE = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/.cache/**'
];

export async function runAgentFlow(targetPath: string, mode: AgentMode = 'default'): Promise<void> {
  console.log(chalk.cyan('\nStarting Context Frame agent...\n'));

  const scanResult = await scanRepository(targetPath);
  const score = calculateScore(scanResult);

  const manager = new CopilotClientManager({
    workspacePath: scanResult.basePath
  });

  const client = await manager.start();

  try {
    const analysisText = await runSubAgentAnalysis(client, scanResult.basePath, score);
    await runMainAgentSession({
      client,
      basePath: scanResult.basePath,
      scanScore: score,
      analysisText,
      mode
    });
  } finally {
    await manager.stop();
  }
}

async function runSubAgentAnalysis(
  client: CopilotClient,
  basePath: string,
  score: ScoreResult
): Promise<string> {
  const session = await client.createSession({
    model: 'gpt-5',
    tools: createRepoTools(basePath, { allowWrite: false }),
    systemMessage: {
      content: [
        'You are the Context Frame sub-agent.',
        'Use the provided tools to explore the repository.',
        'Prefer tools named list_directory, glob_files, read_file, grep_text.',
        'Return a concise report with evidence. Avoid guessing.'
      ].join('\n')
    }
  });

  try {
    const prompt = [
      'Analyze this repository for context quality.',
      `Repository root: ${basePath}`,
      `Static scan: Level ${score.maturityLevel} (${score.maturityName}), quality ${score.qualityScore}/10.`,
      'Checklist:',
      '- List existing context files and any gaps.',
      '- Identify architecture/conventions/testing docs.',
      '- Note build/test/run commands if present.',
      '- Capture evidence with file paths and short excerpts.',
      'Output format:',
      'Summary: <1-2 sentences>',
      'Findings:',
      '- <bullet>',
      'Missing Context Files:',
      '- <bullet>',
      'Suggested Improvements:',
      '- <bullet>',
      'Evidence:',
      '- <path>: <short excerpt>'
    ].join('\n');

    const response = await session.sendAndWait({ prompt });
    return response?.data?.content?.trim() ?? 'Summary: No response from sub-agent.';
  } finally {
    await session.destroy();
  }
}

async function runMainAgentSession(summary: AgentSummary & { client: CopilotClient; mode: AgentMode }): Promise<void> {
  const session = await summary.client.createSession({
    model: 'gpt-5',
    tools: createRepoTools(summary.basePath, { allowWrite: true }),
    systemMessage: {
      content: [
        'You are the Context Frame main agent.',
        'Be conversational and explain what you are doing.',
        'Only use write_file after the user explicitly agrees or when mode is improve.',
        'When asked to improve, generate or update CLAUDE.md, ARCHITECTURE.md, CONVENTIONS.md, and .github/copilot-instructions.md as appropriate.',
        'Prefer using tools to read before writing.'
      ].join('\n')
    }
  });

  try {
    const introPrompt = [
      'You are speaking to the repository owner.',
      `Repository root: ${summary.basePath}`,
      `Static scan: Level ${summary.scanScore.maturityLevel} (${summary.scanScore.maturityName}), quality ${summary.scanScore.qualityScore}/10.`,
      `Recommendations: ${summary.scanScore.recommendations.join('; ') || 'None'}.`,
      'Sub-agent findings:',
      summary.analysisText,
      'Respond with: "I found X. Your repo is at Level Y. Want me to improve it?"',
      'Keep X short and concrete. Keep Y numeric.',
      summary.mode === 'improve'
        ? 'The user already asked for improvement. Confirm briefly and proceed to write files with write_file.'
        : 'Wait for the user response before writing files.'
    ].join('\n');

    await sendAndPrint(session, introPrompt);

    if (summary.mode === 'improve') {
      return;
    }

    const userInput = await readUserInput('> ');
    if (!userInput) {
      return;
    }

    await sendAndPrint(session, userInput);
  } finally {
    await session.destroy();
  }
}

function createRepoTools(basePath: string, options: { allowWrite: boolean }): Tool[] {
  const tools: Tool[] = [
    {
      name: 'list_directory',
      description: 'List files and folders in a directory relative to the repo root.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Relative path from repo root' },
          includeHidden: { type: 'boolean', default: false },
          maxEntries: { type: 'number', default: 200 }
        }
      },
      handler: async (args: unknown) => {
        const typed = args as { path?: string; includeHidden?: boolean; maxEntries?: number };
        const dirPath = resolveRepoPath(basePath, typed.path ?? '.');
        const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
        const includeHidden = typed.includeHidden ?? false;
        const maxEntries = typed.maxEntries ?? 200;

        const results = entries
          .filter(entry => (includeHidden ? true : !entry.name.startsWith('.')))
          .slice(0, maxEntries)
          .map(entry => ({
            name: entry.name,
            type: entry.isDirectory() ? 'directory' : 'file'
          }));

        return { path: path.relative(basePath, dirPath) || '.', entries: results };
      }
    },
    {
      name: 'glob_files',
      description: 'Find files using glob patterns relative to the repo root.',
      parameters: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Glob pattern like **/*.md' },
          maxResults: { type: 'number', default: 200 }
        },
        required: ['pattern']
      },
      handler: async (args: unknown) => {
        const typed = args as { pattern: string; maxResults?: number };
        const matches = await glob(typed.pattern, {
          cwd: basePath,
          nodir: true,
          ignore: DEFAULT_GLOB_IGNORE
        });
        const maxResults = typed.maxResults ?? 200;
        return {
          pattern: typed.pattern,
          matches: matches.slice(0, maxResults),
          truncated: matches.length > maxResults
        };
      }
    },
    {
      name: 'read_file',
      description: 'Read a file from the repository.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Relative path from repo root' },
          startLine: { type: 'number', default: 1 },
          endLine: { type: 'number' }
        },
        required: ['path']
      },
      handler: async (args: unknown) => {
        const typed = args as { path: string; startLine?: number; endLine?: number };
        const filePath = resolveRepoPath(basePath, typed.path);
        const content = await fs.promises.readFile(filePath, 'utf-8');
        const lines = content.split(/\r?\n/);
        const start = Math.max(1, typed.startLine ?? 1);
        const end = Math.min(lines.length, typed.endLine ?? lines.length);
        const slice = lines.slice(start - 1, end).join('\n');
        return {
          path: typed.path,
          startLine: start,
          endLine: end,
          totalLines: lines.length,
          content: slice
        };
      }
    },
    {
      name: 'grep_text',
      description: 'Search for text or regex patterns in the repository.',
      parameters: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Regex pattern or literal text' },
          path: { type: 'string', description: 'Relative path to search within' },
          maxResults: { type: 'number', default: 50 },
          caseSensitive: { type: 'boolean', default: false },
          isRegex: { type: 'boolean', default: true }
        },
        required: ['pattern']
      },
      handler: async (args: unknown) => {
        const typed = args as {
          pattern: string;
          path?: string;
          maxResults?: number;
          caseSensitive?: boolean;
          isRegex?: boolean;
        };
        const maxResults = typed.maxResults ?? 50;
        const searchRoot = resolveRepoPath(basePath, typed.path ?? '.');
        const rootRelative = path.relative(basePath, searchRoot) || '.';
        const rgResults = tryRipgrep(searchRoot, typed.pattern, {
          caseSensitive: typed.caseSensitive ?? false,
          isRegex: typed.isRegex ?? true,
          maxResults
        });

        if (rgResults) {
          return { root: rootRelative, matches: rgResults.matches, truncated: rgResults.truncated };
        }

        const matches = await fallbackSearch(searchRoot, typed.pattern, {
          caseSensitive: typed.caseSensitive ?? false,
          isRegex: typed.isRegex ?? true,
          maxResults
        });

        return {
          root: rootRelative,
          matches: matches.matches,
          truncated: matches.truncated
        };
      }
    }
  ];

  if (options.allowWrite) {
    tools.push({
      name: 'write_file',
      description: 'Write or update a file in the repository.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Relative path from repo root' },
          content: { type: 'string', description: 'Full file contents' },
          mode: { type: 'string', enum: ['overwrite', 'append'], default: 'overwrite' }
        },
        required: ['path', 'content']
      },
      handler: async (args: unknown) => {
        const typed = args as { path: string; content: string; mode?: 'overwrite' | 'append' };
        const filePath = resolveRepoPath(basePath, typed.path);
        await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
        if (typed.mode === 'append') {
          await fs.promises.appendFile(filePath, typed.content, 'utf-8');
        } else {
          await fs.promises.writeFile(filePath, typed.content, 'utf-8');
        }
        return { path: typed.path, bytes: Buffer.byteLength(typed.content, 'utf-8') };
      }
    });
  }

  return tools;
}

function resolveRepoPath(basePath: string, targetPath: string): string {
  const resolved = path.resolve(basePath, targetPath);
  const relative = path.relative(basePath, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Path outside repo: ${targetPath}`);
  }
  return resolved;
}

function tryRipgrep(
  searchRoot: string,
  pattern: string,
  options: { caseSensitive: boolean; isRegex: boolean; maxResults: number }
): { matches: Array<{ path: string; line: number; text: string }>; truncated: boolean } | null {
  const check = spawnSync('rg', ['--version'], { encoding: 'utf-8' });
  if (check.status !== 0) {
    return null;
  }

  const args = ['-n', '--no-heading', '--color', 'never'];
  if (!options.caseSensitive) {
    args.push('-i');
  }
  if (!options.isRegex) {
    args.push('--fixed-strings');
  }
  args.push('--max-count', String(options.maxResults));
  args.push(pattern);
  args.push(searchRoot);

  const result = spawnSync('rg', args, { encoding: 'utf-8' });
  if (result.error) {
    return null;
  }

  const output = result.stdout ?? '';
  if (!output.trim()) {
    return { matches: [], truncated: false };
  }

  const matches = output
    .split(/\r?\n/)
    .filter(Boolean)
    .map(line => {
      const parts = line.split(':');
      const filePath = parts.shift() ?? '';
      const lineNumber = Number(parts.shift() ?? '0');
      const text = parts.join(':');
      return {
        path: path.relative(searchRoot, filePath),
        line: lineNumber,
        text: text.trim()
      };
    });

  return { matches, truncated: matches.length >= options.maxResults };
}

async function fallbackSearch(
  searchRoot: string,
  pattern: string,
  options: { caseSensitive: boolean; isRegex: boolean; maxResults: number }
): Promise<{ matches: Array<{ path: string; line: number; text: string }>; truncated: boolean }> {
  const files = await glob('**/*', {
    cwd: searchRoot,
    nodir: true,
    ignore: DEFAULT_GLOB_IGNORE
  });

  const regex = options.isRegex
    ? new RegExp(pattern, options.caseSensitive ? '' : 'i')
    : new RegExp(escapeRegex(pattern), options.caseSensitive ? '' : 'i');

  const matches: Array<{ path: string; line: number; text: string }> = [];

  for (const file of files) {
    if (matches.length >= options.maxResults) {
      break;
    }

    const absolutePath = path.join(searchRoot, file);
    const stat = await fs.promises.stat(absolutePath);
    if (stat.size > 1024 * 1024) {
      continue;
    }

    const content = await fs.promises.readFile(absolutePath, 'utf-8');
    if (content.includes('\u0000')) {
      continue;
    }

    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i += 1) {
      if (matches.length >= options.maxResults) {
        break;
      }

      const lineText = lines[i];
      regex.lastIndex = 0;
      if (regex.test(lineText)) {
        matches.push({
          path: file,
          line: i + 1,
          text: lineText.trim()
        });
      }
    }
  }

  return { matches, truncated: matches.length >= options.maxResults };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function sendAndPrint(session: { sendAndWait: Function; on: Function }, prompt: string): Promise<string> {
  let buffer = '';
  const unsubscribe = session.on('assistant.message_delta', (event: { data: { deltaContent: string } }) => {
    const chunk = event.data?.deltaContent ?? '';
    if (chunk) {
      process.stdout.write(chunk);
      buffer += chunk;
    }
  });

  const response = await session.sendAndWait({ prompt });
  unsubscribe();

  if (!buffer.trim() && response?.data?.content) {
    console.log(response.data.content);
    buffer = response.data.content;
  } else {
    process.stdout.write('\n');
  }

  return buffer;
}

function readUserInput(prompt: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(prompt, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}
