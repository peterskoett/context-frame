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

type Key = 'up' | 'down' | 'enter' | 'quit' | 'help' | 'search' | 'sort' | 'unknown';
type Mode = 'list' | 'details' | 'help' | 'search';
type SortMode = 'path' | 'tool' | 'weight' | 'level';

const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  reverse: '\x1b[7m'
};

export async function tuiCommand(targetPath: string): Promise<void> {
  const scanResult = await scanRepository(targetPath);
  const score = calculateScore(scanResult);
  const allFiles = scanResult.detectedFiles.slice();

  let selectedIndex = 0;
  let scrollOffset = 0;
  let mode: Mode = 'list';
  let filterText = '';
  let searchBuffer = '';
  let sortMode: SortMode = 'path';
  const footer = 'Arrows: move  Enter: details  /: filter  s: sort  ?: help  q: quit';

  const stdin = process.stdin;
  const stdout = process.stdout;
  const useColor = stdout.isTTY;
  const style = (code: string, text: string): string => (useColor ? `${code}${text}${ANSI.reset}` : text);
  const sortModes: { mode: SortMode; label: string }[] = [
    { mode: 'path', label: 'Path' },
    { mode: 'tool', label: 'Tool' },
    { mode: 'weight', label: 'Weight' },
    { mode: 'level', label: 'Level' }
  ];

  readline.emitKeypressEvents(stdin);
  if (stdin.isTTY) {
    stdin.setRawMode(true);
  }

  const getSortLabel = (): string => {
    const match = sortModes.find((entry) => entry.mode === sortMode);
    return match ? match.label : 'Path';
  };

  const getViewFiles = (): DetectedFile[] => {
    const trimmed = filterText.trim().toLowerCase();
    const filtered = trimmed
      ? allFiles.filter((file) => {
          const haystack = `${file.path} ${file.pattern.tool} ${file.pattern.name}`.toLowerCase();
          return haystack.includes(trimmed);
        })
      : allFiles.slice();
    return filtered.sort((a, b) => {
      if (sortMode === 'tool') {
        return a.pattern.tool.localeCompare(b.pattern.tool) || a.path.localeCompare(b.path);
      }
      if (sortMode === 'weight') {
        return b.pattern.weight - a.pattern.weight || a.path.localeCompare(b.path);
      }
      if (sortMode === 'level') {
        return b.pattern.level - a.pattern.level || a.path.localeCompare(b.path);
      }
      return a.path.localeCompare(b.path);
    });
  };

  const clampSelection = (files: DetectedFile[]): void => {
    if (files.length === 0) {
      selectedIndex = 0;
      scrollOffset = 0;
      return;
    }
    if (selectedIndex >= files.length) {
      selectedIndex = files.length - 1;
    }
    if (selectedIndex < 0) {
      selectedIndex = 0;
    }
  };

  const render = (): void => {
    const width = stdout.columns || 80;
    const height = stdout.rows || 24;
    const headerLines = 9;
    const footerLines = 2;
    const listHeight = Math.max(3, height - headerLines - footerLines);
    const files = getViewFiles();
    clampSelection(files);

    if (selectedIndex < scrollOffset) {
      scrollOffset = selectedIndex;
    } else if (selectedIndex >= scrollOffset + listHeight) {
      scrollOffset = selectedIndex - listHeight + 1;
    }

    const visible = files.slice(scrollOffset, scrollOffset + listHeight);
    const statusLine = `Level ${score.maturityLevel} (${score.maturityName}) | Quality ${score.qualityScore}/10 | Files ${files.length}/${allFiles.length} | Sort ${getSortLabel()}`;
    const filterLine = filterText.trim() ? `Filter "${filterText.trim()}"` : 'Filter (none)';

    stdout.write('\x1b[2J\x1b[H');
    stdout.write(`${style(ANSI.cyan, LOGO)}\n`);
    stdout.write(`${style(ANSI.bold, statusLine)}\n`);
    stdout.write(`${'-'.repeat(Math.min(width, statusLine.length))}\n`);
    stdout.write(`${style(ANSI.dim, filterLine)}\n`);

    if (mode === 'help') {
      const helpLines = [
        style(ANSI.bold, 'Help'),
        '',
        'Arrows        Move selection',
        'Enter         Show details',
        '/             Filter list',
        's             Cycle sort order',
        'h or ?        Help screen',
        'q or Esc      Quit',
        '',
        'Filter matches path, tool, or pattern name.',
        'Press any key to return.'
      ];
      for (const line of helpLines) {
        stdout.write(line.slice(0, width) + '\n');
      }
    } else if (files.length === 0) {
      stdout.write(style(ANSI.yellow, 'No context files match the current filter.\n'));
    } else {
      for (let i = 0; i < visible.length; i++) {
        const fileIndex = scrollOffset + i;
        const prefix = fileIndex === selectedIndex ? '>' : ' ';
        const label = `${prefix} ${visible[i].path}`;
        const line = fileIndex === selectedIndex ? style(ANSI.reverse, label) : label;
        stdout.write(line.slice(0, width) + '\n');
      }
    }

    stdout.write('\n');
    if (mode === 'search') {
      const prompt = `/ filter: ${searchBuffer}`;
      stdout.write(style(ANSI.green, prompt.slice(0, width)) + '\n');
    } else {
      stdout.write(style(ANSI.dim, footer.slice(0, width)) + '\n');
    }
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
    stdout.write(`${style(ANSI.cyan, LOGO)}\n`);
    stdout.write(`${style(ANSI.bold, 'File Details')}\n`);
    stdout.write('-----------\n');
    stdout.write(content + '\n\n');
    stdout.write(style(ANSI.dim, 'Press any key to return.\n'));
  };

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
    if (input === 'h' || input === 'H' || input === '?') {
      return 'help';
    }
    if (input === '/') {
      return 'search';
    }
    if (input === 's' || input === 'S') {
      return 'sort';
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

  const applyFilter = (nextFilter: string): void => {
    filterText = nextFilter;
    selectedIndex = 0;
    scrollOffset = 0;
  };

  const cycleSort = (): void => {
    const index = sortModes.findIndex((entry) => entry.mode === sortMode);
    const nextIndex = (index + 1) % sortModes.length;
    sortMode = sortModes[nextIndex].mode;
    selectedIndex = 0;
    scrollOffset = 0;
  };

  const handleSearchInput = (input: string): void => {
    if (input === '\u001b') {
      mode = 'list';
      render();
      return;
    }
    if (input === '\r' || input === '\n') {
      applyFilter(searchBuffer.trim());
      mode = 'list';
      render();
      return;
    }
    if (input === '\u007f' || input === '\b') {
      searchBuffer = searchBuffer.slice(0, -1);
      render();
      return;
    }
    if (input.includes('\u001b')) {
      return;
    }
    for (const char of input) {
      if (char >= ' ') {
        searchBuffer += char;
      }
    }
    render();
  };

  const onData = (chunk: Buffer): void => {
    if (mode === 'search') {
      handleSearchInput(chunk.toString('utf8'));
      return;
    }

    const key = readKey(chunk);
    const files = getViewFiles();
    clampSelection(files);

    if (key === 'quit') {
      cleanup();
      process.exit(0);
    }

    if (mode === 'details' || mode === 'help') {
      mode = 'list';
      render();
      return;
    }

    if (key === 'up') {
      if (files.length === 0) {
        return;
      }
      selectedIndex = Math.max(0, selectedIndex - 1);
      render();
      return;
    }
    if (key === 'down') {
      if (files.length === 0) {
        return;
      }
      selectedIndex = Math.min(files.length - 1, selectedIndex + 1);
      render();
      return;
    }
    if (key === 'enter' && files[selectedIndex]) {
      mode = 'details';
      showDetails(files[selectedIndex]);
      return;
    }
    if (key === 'help') {
      mode = 'help';
      render();
      return;
    }
    if (key === 'search') {
      mode = 'search';
      searchBuffer = filterText;
      render();
      return;
    }
    if (key === 'sort') {
      cycleSort();
      render();
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
