import chalk from 'chalk';
import { scanRepository } from '../services/scanner';
import { calculateScore, ScoreResult } from '../services/scorer';
import { MATURITY_LEVELS } from '../models/levels';

export async function scanCommand(targetPath: string): Promise<void> {
  console.log(chalk.cyan('\n🔍 Scanning repository for AI context maturity...\n'));

  try {
    const scanResult = await scanRepository(targetPath);
    const score = calculateScore(scanResult);

    printTerminalReport(score, scanResult.basePath);
  } catch (error) {
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}

function printTerminalReport(score: ScoreResult, basePath: string): void {
  // Header
  console.log(chalk.bold.white('═══════════════════════════════════════════════════════════════'));
  console.log(chalk.bold.cyan('                    CONTEXT FRAME REPORT'));
  console.log(chalk.bold.white('═══════════════════════════════════════════════════════════════\n'));

  // Path
  console.log(chalk.gray(`Repository: ${basePath}\n`));

  // Maturity Level with visual
  const levelColor = getLevelColor(score.maturityLevel);
  console.log(chalk.bold.white('MATURITY LEVEL'));
  console.log(levelColor(`  Level ${score.maturityLevel}: ${score.maturityName}`));
  console.log(chalk.gray(`  ${score.maturityDescription}\n`));

  // Level progress bar
  printLevelBar(score.maturityLevel);

  // Quality Score
  console.log(chalk.bold.white('\nQUALITY SCORE'));
  const scoreColor = score.qualityScore >= 7 ? chalk.green :
                     score.qualityScore >= 4 ? chalk.yellow : chalk.red;
  console.log(scoreColor(`  ${score.qualityScore}/10`) + chalk.gray(` (Weight: ${score.totalWeight})`));
  printScoreBar(score.qualityScore);

  // Quality Metrics
  console.log(chalk.bold.white('\nQUALITY METRICS'));
  console.log(chalk.gray(`  Sections:    ${score.qualityMetrics.sections}`));
  console.log(chalk.gray(`  File Paths:  ${score.qualityMetrics.filePaths}`));
  console.log(chalk.gray(`  Commands:    ${score.qualityMetrics.commands}`));
  console.log(chalk.gray(`  Constraints: ${score.qualityMetrics.constraints}`));
  console.log(chalk.gray(`  Word Count:  ${score.qualityMetrics.wordCount}`));

  // Tool Breakdown
  console.log(chalk.bold.white('\nTOOL COVERAGE'));
  for (const [tool, data] of Object.entries(score.toolBreakdown)) {
    const toolColor = getToolColor(tool);
    console.log(toolColor(`  ${tool}`) + chalk.gray(` (weight: ${data.weight})`));
    for (const file of data.files) {
      console.log(chalk.gray(`    - ${file}`));
    }
  }

  if (Object.keys(score.toolBreakdown).length === 0) {
    console.log(chalk.gray('  No AI context files detected'));
  }

  // Recommendations
  if (score.recommendations.length > 0) {
    console.log(chalk.bold.white('\nRECOMMENDATIONS'));
    for (const rec of score.recommendations) {
      console.log(chalk.yellow(`  → ${rec}`));
    }
  }

  console.log(chalk.bold.white('\n═══════════════════════════════════════════════════════════════\n'));
}

function printLevelBar(level: number): void {
  const bar = [];
  for (let i = 1; i <= 8; i++) {
    if (i <= level) {
      bar.push(getLevelColor(i)('█'));
    } else {
      bar.push(chalk.gray('░'));
    }
  }
  console.log('  ' + bar.join('') + chalk.gray(` ${level}/8`));

  // Level labels
  console.log(chalk.gray('  12345678'));
}

function printScoreBar(score: number): void {
  const filled = Math.round(score);
  const empty = 10 - filled;
  const color = score >= 7 ? chalk.green : score >= 4 ? chalk.yellow : chalk.red;
  console.log('  ' + color('█'.repeat(filled)) + chalk.gray('░'.repeat(empty)));
}

function getLevelColor(level: number): chalk.Chalk {
  if (level <= 2) return chalk.red;
  if (level <= 4) return chalk.yellow;
  if (level <= 6) return chalk.green;
  return chalk.cyan;
}

function getToolColor(tool: string): chalk.Chalk {
  switch (tool) {
    case 'Claude Code': return chalk.magenta;
    case 'GitHub Copilot': return chalk.blue;
    case 'Cursor': return chalk.cyan;
    case 'OpenAI Codex': return chalk.green;
    default: return chalk.white;
  }
}
