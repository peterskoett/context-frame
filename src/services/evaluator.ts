import * as fs from 'fs';
import * as path from 'path';
import type { CopilotClient } from '@github/copilot-sdk';
import { CopilotClientManager } from './copilot-client';

export interface EvalPrompt {
  id?: string;
  prompt: string;
}

export interface EvalConfig {
  prompts: EvalPrompt[];
  contextFiles?: string[];
  model?: string;
  judgeModel?: string;
  rubric?: string;
}

export interface EvalResult {
  promptId: string;
  prompt: string;
  withoutContext: string;
  withContext: string;
  judge: {
    scoreWithout: number;
    scoreWith: number;
    verdict: string;
  };
}

export async function runEvaluation(configPath: string, basePath: string): Promise<EvalResult[]> {
  const config = loadEvalConfig(configPath, basePath);
  const manager = new CopilotClientManager({ workspacePath: basePath });
  const client = await manager.start();

  try {
    const results: EvalResult[] = [];
    for (const prompt of config.prompts) {
      const withoutContext = await runPrompt(client, config.model ?? 'gpt-5', prompt.prompt);
      const withContext = await runPrompt(
        client,
        config.model ?? 'gpt-5',
        buildContextPrompt(prompt.prompt, config.contextFiles ?? [], basePath)
      );
      const judge = await runJudge(
        client,
        config.judgeModel ?? 'gpt-5',
        config.rubric ?? defaultRubric(),
        prompt.prompt,
        withoutContext,
        withContext
      );
      results.push({
        promptId: prompt.id ?? prompt.prompt.slice(0, 32),
        prompt: prompt.prompt,
        withoutContext,
        withContext,
        judge
      });
    }
    return results;
  } finally {
    await manager.stop();
  }
}

function loadEvalConfig(configPath: string, basePath: string): EvalConfig {
  const fullPath = path.isAbsolute(configPath) ? configPath : path.join(basePath, configPath);
  const content = fs.readFileSync(fullPath, 'utf-8');
  const parsed = JSON.parse(content) as EvalConfig;
  if (!parsed.prompts || parsed.prompts.length === 0) {
    throw new Error('Eval config must include prompts.');
  }
  return parsed;
}

async function runPrompt(client: CopilotClient, model: string, prompt: string): Promise<string> {
  const session = await client.createSession({ model });
  try {
    const response = await session.sendAndWait({ prompt });
    return response?.data?.content?.trim() ?? '';
  } finally {
    await session.destroy();
  }
}

function buildContextPrompt(prompt: string, contextFiles: string[], basePath: string): string {
  if (contextFiles.length === 0) {
    return prompt;
  }
  const contextBlocks = contextFiles
    .map(file => {
      const fullPath = path.isAbsolute(file) ? file : path.join(basePath, file);
      const content = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf-8') : '';
      return `### ${file}\n${content}`;
    })
    .join('\n\n');
  return `${prompt}\n\nContext:\n${contextBlocks}`;
}

async function runJudge(
  client: CopilotClient,
  model: string,
  rubric: string,
  prompt: string,
  withoutContext: string,
  withContext: string
): Promise<{ scoreWithout: number; scoreWith: number; verdict: string }> {
  const judgePrompt = [
    'You are a strict evaluator. Score each answer from 1-10.',
    rubric,
    'Prompt:',
    prompt,
    'Answer A (no context):',
    withoutContext,
    'Answer B (with context):',
    withContext,
    'Respond in JSON with keys: scoreWithout, scoreWith, verdict.'
  ].join('\n\n');

  const session = await client.createSession({ model });
  try {
    const response = await session.sendAndWait({ prompt: judgePrompt });
    const content = response?.data?.content ?? '{}';
    const json = extractJson(content);
    return {
      scoreWithout: Number(json.scoreWithout ?? 0),
      scoreWith: Number(json.scoreWith ?? 0),
      verdict: String(json.verdict ?? '')
    };
  } finally {
    await session.destroy();
  }
}

function extractJson(text: string): Record<string, unknown> {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    return {};
  }
  try {
    return JSON.parse(match[0]);
  } catch {
    return {};
  }
}

function defaultRubric(): string {
  return 'Judge correctness, completeness, and adherence to repo conventions.';
}
