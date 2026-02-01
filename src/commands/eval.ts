import chalk from 'chalk';
import { runEvaluation } from '../services/evaluator';

export type EvalFormat = 'json' | 'markdown';

export async function evalCommand(configPath: string, targetPath: string, format: EvalFormat = 'json'): Promise<void> {
  console.log(chalk.cyan('\nRunning evaluation...\n'));
  try {
    const results = await runEvaluation(configPath, targetPath);
    if (format === 'markdown') {
      const lines: string[] = [];
      lines.push('# Context Frame Evaluation\n');
      for (const result of results) {
        lines.push(`## ${result.promptId}`);
        lines.push(`**Score (no context):** ${result.judge.scoreWithout}`);
        lines.push(`**Score (with context):** ${result.judge.scoreWith}`);
        lines.push(`**Verdict:** ${result.judge.verdict}\n`);
      }
      console.log(lines.join('\n'));
    } else {
      console.log(JSON.stringify({ results }, null, 2));
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}
