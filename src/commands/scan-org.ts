import chalk from 'chalk';
import { scanOrg } from '../services/org-scanner';
import { calculateScore } from '../services/scorer';

export type OrgReportFormat = 'terminal' | 'json' | 'markdown' | 'csv';

export async function scanOrgCommand(org: string, format: OrgReportFormat = 'terminal'): Promise<void> {
  console.log(chalk.cyan(`\n[scan] Scanning GitHub org: ${org}\n`));

  try {
    const orgResult = await scanOrg(org);
    const summaries = orgResult.repos.map(repo => {
      const scanResult = {
        basePath: repo.name,
        detectedFiles: repo.detectedFiles,
        toolsDetected: Array.from(new Set(repo.detectedFiles.map(file => file.pattern.tool))),
        totalFilesScanned: repo.detectedFiles.length,
        referenceValidation: {
          totalReferences: 0,
          resolvedReferences: 0,
          resolutionRate: 1,
          brokenReferences: []
        },
        commitCounts: {}
      };
      const score = calculateScore(scanResult);
      return { repo: repo.name, score };
    });

    switch (format) {
      case 'json':
        console.log(JSON.stringify({ org, summaries }, null, 2));
        break;
      case 'markdown':
        printMarkdown(org, summaries);
        break;
      case 'csv':
        printCsv(org, summaries);
        break;
      case 'terminal':
      default:
        printTerminal(org, summaries);
        break;
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}

function printTerminal(org: string, summaries: Array<{ repo: string; score: ReturnType<typeof calculateScore> }>): void {
  console.log(chalk.bold.white(`Org: ${org}`));
  for (const summary of summaries) {
    console.log(
      chalk.gray(`- ${summary.repo}: Level ${summary.score.maturityLevel} (${summary.score.maturityName}), ${summary.score.qualityScore}/10`)
    );
  }
}

function printMarkdown(org: string, summaries: Array<{ repo: string; score: ReturnType<typeof calculateScore> }>): void {
  const lines: string[] = [];
  lines.push(`# Context Frame Org Report`);
  lines.push(`**Org:** ${org}`);
  lines.push('');
  lines.push('| Repo | Level | Quality |');
  lines.push('|------|-------|---------|');
  for (const summary of summaries) {
    lines.push(`| ${summary.repo} | ${summary.score.maturityLevel} | ${summary.score.qualityScore}/10 |`);
  }
  console.log(lines.join('\n'));
}

function printCsv(org: string, summaries: Array<{ repo: string; score: ReturnType<typeof calculateScore> }>): void {
  console.log('org,repo,level,quality_score');
  for (const summary of summaries) {
    console.log(
      `"${org}","${summary.repo}","${summary.score.maturityLevel}","${summary.score.qualityScore}"`
    );
  }
}
