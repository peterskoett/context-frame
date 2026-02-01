import chalk from 'chalk';
import chokidar from 'chokidar';
import { scanRepository } from '../services/scanner';
import { calculateScore, ScoreResult } from '../services/scorer';
import { MATURITY_LEVELS } from '../models/levels';

export type ScanFormat = 'terminal' | 'json' | 'markdown' | 'csv' | 'sarif';

export async function scanCommand(
  targetPath: string,
  format: ScanFormat = 'terminal',
  watch = false
): Promise<void> {
  const runScan = async (): Promise<void> => {
    console.log(chalk.cyan('\n[scan] Scanning repository for AI context maturity...\n'));

    try {
      const scanResult = await scanRepository(targetPath);
      const score = calculateScore(scanResult);

      switch (format) {
        case 'json':
          printJsonReport(score, scanResult.basePath, scanResult);
          break;
        case 'markdown':
          printMarkdownReport(score, scanResult.basePath, scanResult);
          break;
        case 'csv':
          printCsvReport(score, scanResult.basePath, scanResult);
          break;
        case 'sarif':
          printSarifReport(score, scanResult.basePath, scanResult);
          break;
        case 'terminal':
        default:
          printTerminalReport(score, scanResult.basePath, scanResult);
          break;
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      if (!watch) {
        process.exit(1);
      }
    }
  };

  await runScan();

  if (!watch) {
    return;
  }

  const watcher = chokidar.watch(targetPath, {
    ignored: ['**/node_modules/**', '**/.git/**'],
    ignoreInitial: true
  });

  let timer: NodeJS.Timeout | null = null;
  const schedule = (): void => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      console.clear();
      runScan().catch(() => {});
    }, 200);
  };

  watcher.on('all', schedule);
  await new Promise<void>(() => {});
}

function printTerminalReport(score: ScoreResult, basePath: string, scanResult: ReturnType<typeof scanRepository> extends Promise<infer T> ? T : never): void {
  // Header
  console.log(chalk.bold.white('==============================================================='));
  console.log(chalk.bold.cyan('                    CONTEXT FRAME REPORT'));
  console.log(chalk.bold.white('===============================================================\n'));

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
  if (score.commitBonus > 0) {
    console.log(chalk.gray(`  Commit Bonus: +${score.commitBonus.toFixed(1)}`));
  }

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
      console.log(chalk.yellow(`  -> ${rec}`));
    }
  }

  // Reference validation
  console.log(chalk.bold.white('\nREFERENCE VALIDATION'));
  const ref = scanResult.referenceValidation;
  const resolvedColor = ref.resolutionRate >= 0.9 ? chalk.green : ref.resolutionRate >= 0.7 ? chalk.yellow : chalk.red;
  console.log(resolvedColor(`  ${ref.resolvedReferences}/${ref.totalReferences} refs resolved (${Math.round(ref.resolutionRate * 100)}%)`));
  if (ref.brokenReferences.length > 0) {
    console.log(chalk.gray(`  Broken refs: ${ref.brokenReferences.length}`));
  }

  // Commit history
  console.log(chalk.bold.white('\nCONTEXT FILE HISTORY'));
  const commitCounts = scanResult.commitCounts;
  const trackedFiles = Object.keys(commitCounts);
  const bonusFiles = trackedFiles.filter(file => commitCounts[file] >= 5).length;
  console.log(chalk.gray(`  Files tracked: ${trackedFiles.length}`));
  console.log(chalk.gray(`  Files with 5+ commits: ${bonusFiles}`));
  const topFiles = trackedFiles
    .map(file => ({ file, count: commitCounts[file] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  if (topFiles.length > 0) {
    console.log(chalk.gray('  Top files:'));
    for (const entry of topFiles) {
      console.log(chalk.gray(`    - ${entry.file}: ${entry.count} commits`));
    }
  }

  console.log(chalk.bold.white('\n===============================================================\n'));
}

function printJsonReport(
  score: ScoreResult,
  basePath: string,
  scanResult: ReturnType<typeof scanRepository> extends Promise<infer T> ? T : never
): void {
  const report = buildReportData(score, basePath, scanResult);
  console.log(JSON.stringify(report, null, 2));
}

function printMarkdownReport(
  score: ScoreResult,
  basePath: string,
  scanResult: ReturnType<typeof scanRepository> extends Promise<infer T> ? T : never
): void {
  const report = buildReportData(score, basePath, scanResult);
  const lines: string[] = [];

  lines.push('# Context Frame Report\n');
  lines.push(`**Repository:** \`${report.repository}\`\n`);
  lines.push(`**Generated:** ${report.timestamp}\n`);
  lines.push(`**Level:** ${report.maturity.level} - ${report.maturity.name}\n`);
  lines.push(`**Quality:** ${report.quality.score}/10 (bonus: +${report.quality.commitBonus})\n`);

  lines.push('## Reference Validation\n');
  lines.push(`Resolved: ${report.references.resolved}/${report.references.total} (${Math.round(report.references.rate * 100)}%)\n`);
  if (report.references.broken.length > 0) {
    lines.push('Broken references:');
    for (const broken of report.references.broken.slice(0, 10)) {
      lines.push(`- ${broken.sourceFile} -> ${broken.reference}`);
    }
    lines.push('');
  }

  lines.push('## Commit History\n');
  lines.push(`Files tracked: ${report.commits.files}\n`);
  lines.push(`Files with 5+ commits: ${report.commits.filesWithFivePlus}\n`);

  console.log(lines.join('\n'));
}

function printCsvReport(
  score: ScoreResult,
  basePath: string,
  scanResult: ReturnType<typeof scanRepository> extends Promise<infer T> ? T : never
): void {
  const report = buildReportData(score, basePath, scanResult);
  const headers = [
    'repository',
    'timestamp',
    'level',
    'quality_score',
    'commit_bonus',
    'refs_total',
    'refs_resolved',
    'refs_rate',
    'context_files',
    'context_files_5plus'
  ];
  const row = [
    report.repository,
    report.timestamp,
    report.maturity.level,
    report.quality.score,
    report.quality.commitBonus,
    report.references.total,
    report.references.resolved,
    report.references.rate.toFixed(2),
    report.commits.files,
    report.commits.filesWithFivePlus
  ];
  console.log(headers.join(','));
  console.log(row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','));
}

function printSarifReport(
  score: ScoreResult,
  basePath: string,
  scanResult: ReturnType<typeof scanRepository> extends Promise<infer T> ? T : never
): void {
  const broken = scanResult.referenceValidation.brokenReferences;
  const results: any[] = broken.map(issue => ({
    ruleId: 'CF002',
    level: 'warning',
    message: {
      text: `Broken reference: ${issue.reference}`
    },
    locations: [
      {
        physicalLocation: {
          artifactLocation: {
            uri: issue.sourceFile
          },
          region: {
            startLine: 1
          }
        }
      }
    ],
    properties: {
      resolvedPath: issue.resolvedPath || null
    }
  }));

  results.unshift({
    ruleId: 'CF001',
    level: 'note',
    message: {
      text: `Maturity level ${score.maturityLevel}: ${score.maturityName}. Quality ${score.qualityScore}/10 (weight ${score.totalWeight}).`
    },
    properties: {
      maturityLevel: score.maturityLevel,
      qualityScore: score.qualityScore,
      totalWeight: score.totalWeight,
      basePath
    }
  });

  const sarif = {
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'Context Frame',
            informationUri: 'https://github.com/peterskoett/context-frame',
            rules: [
              {
                id: 'CF001',
                name: 'context-maturity',
                shortDescription: {
                  text: 'Context maturity summary'
                },
                fullDescription: {
                  text: 'Summary of context maturity level and quality score.'
                },
                defaultConfiguration: {
                  level: 'note'
                }
              },
              {
                id: 'CF002',
                name: 'broken-reference',
                shortDescription: {
                  text: 'Broken documentation reference'
                },
                fullDescription: {
                  text: 'A documentation reference could not be resolved.'
                },
                defaultConfiguration: {
                  level: 'warning'
                }
              }
            ]
          }
        },
        invocations: [
          {
            executionSuccessful: true,
            endTimeUtc: new Date().toISOString()
          }
        ],
        results
      }
    ]
  };

  console.log(JSON.stringify(sarif, null, 2));
}

function buildReportData(
  score: ScoreResult,
  basePath: string,
  scanResult: ReturnType<typeof scanRepository> extends Promise<infer T> ? T : never
) {
  const ref = scanResult.referenceValidation;
  const commitCounts = scanResult.commitCounts;
  const filesWithFivePlus = Object.values(commitCounts).filter(count => count >= 5).length;
  return {
    repository: basePath,
    timestamp: new Date().toISOString(),
    maturity: {
      level: score.maturityLevel,
      name: score.maturityName,
      description: score.maturityDescription
    },
    quality: {
      score: score.qualityScore,
      commitBonus: score.commitBonus
    },
    references: {
      total: ref.totalReferences,
      resolved: ref.resolvedReferences,
      rate: ref.resolutionRate,
      broken: ref.brokenReferences
    },
    commits: {
      files: Object.keys(commitCounts).length,
      filesWithFivePlus,
      counts: commitCounts
    }
  };
}

function printLevelBar(level: number): void {
  const bar = [];
  for (let i = 1; i <= 8; i++) {
    if (i <= level) {
      bar.push(getLevelColor(i)('#'));
    } else {
      bar.push(chalk.gray('-'));
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
  console.log('  ' + color('#'.repeat(filled)) + chalk.gray('-'.repeat(empty)));
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
