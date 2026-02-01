import chalk from 'chalk';
import { scanRepository, DetectedFile } from '../services/scanner';
import { calculateScore, ScoreResult } from '../services/scorer';
import { MATURITY_LEVELS } from '../models/levels';
import { FILE_PATTERNS } from '../models/patterns';

// ASCII art header
const HEADER = `
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ██████╗ ██████╗ ███╗   ██╗████████╗███████╗██╗  ██╗████████╗║
║  ██╔════╝██╔═══██╗████╗  ██║╚══██╔══╝██╔════╝╚██╗██╔╝╚══██╔══╝║
║  ██║     ██║   ██║██╔██╗ ██║   ██║   █████╗   ╚███╔╝    ██║   ║
║  ██║     ██║   ██║██║╚██╗██║   ██║   ██╔══╝   ██╔██╗    ██║   ║
║  ╚██████╗╚██████╔╝██║ ╚████║   ██║   ███████╗██╔╝ ██╗   ██║   ║
║   ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚═╝  ╚═╝   ╚═╝   ║
║                                                               ║
║   ███████╗██████╗  █████╗ ███╗   ███╗███████╗                 ║
║   ██╔════╝██╔══██╗██╔══██╗████╗ ████║██╔════╝                 ║
║   █████╗  ██████╔╝███████║██╔████╔██║█████╗                   ║
║   ██╔══╝  ██╔══██╗██╔══██║██║╚██╔╝██║██╔══╝                   ║
║   ██║     ██║  ██║██║  ██║██║ ╚═╝ ██║███████╗                 ║
║   ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝                 ║
║                                                               ║
║             AI Context Maturity Scanner                       ║
╚═══════════════════════════════════════════════════════════════╝
`;

interface FileInfo {
  path: string;
  tool: string;
  weight: number;
  quality: number;
}

export async function tuiCommand(targetPath: string): Promise<void> {
  // For now, use fallback display - OpenTUI integration coming soon
  // The full interactive TUI requires more OpenTUI API research
  await fallbackDisplay(targetPath);
}

// Fallback display with nice formatting
async function fallbackDisplay(targetPath: string): Promise<void> {
  console.log(chalk.cyan(HEADER));
  
  console.log(chalk.cyan('Scanning repository...\n'));
  
  const scanResult = await scanRepository(targetPath);
  const score = calculateScore(scanResult);
  
  // Extract file info
  const files: FileInfo[] = scanResult.detectedFiles.map((f: DetectedFile) => ({
    path: f.path,
    tool: f.pattern.tool,
    weight: f.pattern.weight,
    quality: f.metrics ? calculateQualityFromMetrics(f.metrics) : 0
  }));
  
  // Level display
  const level = MATURITY_LEVELS[score.maturityLevel - 1];
  console.log(chalk.bold.white('MATURITY LEVEL'));
  console.log(chalk.cyan(`  Level ${score.maturityLevel}: ${level?.name || 'Unknown'}`));
  console.log(chalk.gray(`  ${level?.description || ''}`));
  const levelBar = '█'.repeat(score.maturityLevel) + '░'.repeat(8 - score.maturityLevel);
  console.log(chalk.cyan(`  [${levelBar}] ${score.maturityLevel}/8\n`));
  
  // Quality display
  console.log(chalk.bold.white('QUALITY SCORE'));
  const qualityBar = '█'.repeat(Math.round(score.qualityScore)) + '░'.repeat(10 - Math.round(score.qualityScore));
  console.log(chalk.green(`  [${qualityBar}] ${score.qualityScore.toFixed(1)}/10\n`));
  
  // Files display
  console.log(chalk.bold.white('DETECTED FILES'));
  for (const file of files) {
    const qBar = '█'.repeat(Math.round(file.quality)) + '░'.repeat(10 - Math.round(file.quality));
    console.log(chalk.white(`  ${file.path}`));
    console.log(chalk.gray(`    ${file.tool} | Weight: ${file.weight} | Quality: [${qBar}] ${file.quality.toFixed(1)}`));
  }
  
  // Tool coverage summary
  console.log(chalk.bold.white('\nTOOL COVERAGE'));
  for (const [tool, data] of Object.entries(score.toolBreakdown)) {
    console.log(chalk.gray(`  ${tool}: ${data.files.length} file(s), weight ${data.weight}`));
  }
  
  // Recommendations
  if (score.recommendations.length > 0) {
    console.log(chalk.bold.white('\nRECOMMENDATIONS'));
    for (const rec of score.recommendations) {
      console.log(chalk.yellow(`  → ${rec}`));
    }
  }
  
  console.log(chalk.cyan('\n' + '─'.repeat(60)));
  console.log(chalk.gray('\nTip: Full interactive TUI with OpenTUI coming soon!\n'));
}

// Calculate quality score from metrics (0-10 scale)
function calculateQualityFromMetrics(metrics: NonNullable<DetectedFile['metrics']>): number {
  const sectionScore = Math.min(metrics.sections / 5, 1) * 2;
  const pathScore = Math.min(metrics.filePaths / 10, 1) * 2;
  const commandScore = Math.min(metrics.commands / 5, 1) * 2;
  const constraintScore = Math.min(metrics.constraints / 5, 1) * 2;
  const wordScore = Math.min(metrics.wordCount / 500, 1) * 2;
  return sectionScore + pathScore + commandScore + constraintScore + wordScore;
}

// Pattern browser
export function listPatterns(): void {
  console.log(chalk.cyan(HEADER));
  console.log(chalk.bold.white('AVAILABLE PATTERNS\n'));
  
  for (const pattern of FILE_PATTERNS) {
    console.log(chalk.cyan(`  ${pattern.name}`));
    console.log(chalk.gray(`    Patterns: ${pattern.patterns.join(', ')}`));
    console.log(chalk.gray(`    Tool: ${pattern.tool} | Level: ${pattern.level} | Weight: ${pattern.weight}`));
    console.log();
  }
}

// Level browser
export function listLevels(): void {
  console.log(chalk.cyan(HEADER));
  console.log(chalk.bold.white('MATURITY LEVELS\n'));
  
  for (const level of MATURITY_LEVELS) {
    const bar = '█'.repeat(level.level) + '░'.repeat(8 - level.level);
    console.log(chalk.cyan(`  Level ${level.level}: ${level.name}`));
    console.log(chalk.gray(`    ${level.description}`));
    console.log(chalk.gray(`    [${bar}]`));
    console.log();
  }
}
