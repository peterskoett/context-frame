import readline from 'readline';
import { scanRepository, DetectedFile } from '../services/scanner';
import { calculateScore } from '../services/scorer';
import { FILE_PATTERNS } from '../models/patterns';
import { MATURITY_LEVELS } from '../models/levels';

const LOGO = [
  '  ____            _            _     _____                         ',
  ' / ___|___  _ __ | |_ _____  _| |_  |  ___| __ __ _ _ __ ___   ___ ',
  "| |   / _ \\| '_ \\| __/ _ \\ \\/ / __| | |_ | '__/ _` | '_ ` _ \\ / _ \\",
  '| |__| (_) | | | | ||  __/>  <| |_  |  _|| | | (_| | | | | | |  __/',
  ' \\____\\___/|_| |_|\\__\\___/_/\\_\\\\__| |_|  |_|  \\__,_|_| |_| |_|\\___|'
].join('\n');

type Key = 'up' | 'down' | 'enter' | 'quit' | 'unknown';

export async function tuiCommand(targetPath: string): Promise<void> {
  const scanResult = await scanRepository(targetPath);
  const score = calculateScore(scanResult);
  const files = scanResult.detectedFiles.slice().sort((a, b) => a.path.localeCompare(b.path));

  let selectedIndex = 0;
  let scrollOffset = 0;
  const footer = 'Arrow keys: navigate  Enter: details  q: quit';

  const stdin = process.stdin;
  const stdout = process.stdout;

  readline.emitKeypressEvents(stdin);
  if (stdin.isTTY) {
    stdin.setRawMode(true);
  }

  const render = (): void => {
    const width = stdout.columns || 80;
    const height = stdout.rows || 24;
    const headerLines = 9;
    const footerLines = 2;
    const listHeight = Math.max(3, height - headerLines - footerLines);

    if (selectedIndex < scrollOffset) {
      scrollOffset = selectedIndex;
    } else if (selectedIndex >= scrollOffset + listHeight) {
      scrollOffset = selectedIndex - listHeight + 1;
    }

    const visible = files.slice(scrollOffset, scrollOffset + listHeight);
    const statusLine = `Level ${score.maturityLevel} (${score.maturityName}) | Quality ${score.qualityScore}/10 | Files ${files.length}`;

    stdout.write('\x1b[2J\x1b[H');
    stdout.write(`${LOGO}\n`);
    stdout.write(`${statusLine}\n`);
    stdout.write(`${'-'.repeat(Math.min(width, statusLine.length))}\n`);

    if (files.length === 0) {
      stdout.write('No context files detected.\n');
    } else {
      for (let i = 0; i < visible.length; i++) {
        const fileIndex = scrollOffset + i;
        const prefix = fileIndex === selectedIndex ? '>' : ' ';
        const label = `${prefix} ${visible[i].path}`;
        stdout.write(label.slice(0, width) + '\n');
      }
    }

    stdout.write('\n');
    stdout.write(footer.slice(0, width) + '\n');
  };

  const showDetails = (file: DetectedFile): void => {
    const lines: string[] = [];
    lines.push(`Path: ${file.path}`);
    lines.push(`Tool: ${file.pattern.tool}`);
    lines.push(`Pattern: ${file.pattern.name}`);
    lines.push(`Weight: ${file.pattern.weight}`);
    lines.push(`Level: ${file.pattern.level}`);
    if (file.size !== undefined) {
      lines.push(`Size: ${file.size} bytes`);
    }
    if (file.wordCount !== undefined) {
      lines.push(`Word count: ${file.wordCount}`);
    }
    if (file.metrics) {
      lines.push(`Sections: ${file.metrics.sections}`);
      lines.push(`File paths: ${file.metrics.filePaths}`);
      lines.push(`Commands: ${file.metrics.commands}`);
      lines.push(`Constraints: ${file.metrics.constraints}`);
      lines.push(`Words: ${file.metrics.wordCount}`);
    }
    const content = lines.join('\n');
    stdout.write('\x1b[2J\x1b[H');
    stdout.write(`${LOGO}\n`);
    stdout.write('File Details\n');
    stdout.write('-----------\n');
    stdout.write(content + '\n\n');
    stdout.write('Press any key to return.\n');
  };

  let mode: 'list' | 'details' = 'list';

  const readKey = (chunk: Buffer): Key => {
    const input = chunk.toString('utf8');
    if (input === '\u0003' || input === 'q' || input === 'Q' || input === '\u001b') {
      return 'quit';
    }
    if (input === '\r' || input === '\n') {
      return 'enter';
    }
    if (input === '\u001b[A') {
      return 'up';
    }
    if (input === '\u001b[B') {
      return 'down';
    }
    return 'unknown';
  };

  const cleanup = (): void => {
    stdin.removeListener('data', onData);
    if (stdin.isTTY) {
      stdin.setRawMode(false);
    }
    stdout.write('\x1b[2J\x1b[H');
  };

  const onData = (chunk: Buffer): void => {
    const key = readKey(chunk);

    if (key === 'quit') {
      cleanup();
      process.exit(0);
    }

    if (mode === 'details') {
      mode = 'list';
      render();
      return;
    }

    if (key === 'up') {
      selectedIndex = Math.max(0, selectedIndex - 1);
      render();
      return;
    }
    if (key === 'down') {
      selectedIndex = Math.min(files.length - 1, selectedIndex + 1);
      render();
      return;
    }
    if (key === 'enter' && files[selectedIndex]) {
      mode = 'details';
      showDetails(files[selectedIndex]);
      return;
    }
  };

  const onResize = (): void => {
    if (mode === 'list') {
      render();
    }
  };

  process.on('SIGWINCH', onResize);
  const cleanupOnExit = (): void => {
    process.off('SIGWINCH', onResize);
    cleanup();
  };
  process.on('exit', cleanupOnExit);

  stdin.on('data', onData);
  render();
}

export function listPatterns(): void {
  console.log(LOGO);
  console.log('\nAVAILABLE PATTERNS\n');
  for (const pattern of FILE_PATTERNS) {
    console.log(`- ${pattern.name}`);
    console.log(`  Patterns: ${pattern.patterns.join(', ')}`);
    console.log(`  Tool: ${pattern.tool} | Level: ${pattern.level} | Weight: ${pattern.weight}\n`);
  }
}

export function listLevels(): void {
  console.log(LOGO);
  console.log('\nMATURITY LEVELS\n');
  for (const level of MATURITY_LEVELS) {
    const bar = '#'.repeat(level.level) + '-'.repeat(8 - level.level);
    console.log(`- Level ${level.level}: ${level.name}`);
    console.log(`  ${level.description}`);
    console.log(`  [${bar}]\n`);
  }
}
