import chalk from 'chalk';
import { initCiWorkflow, runCi } from '../services/ci';

export async function ciCommand(targetPath: string, options: { init?: boolean }): Promise<void> {
  if (options.init) {
    const workflowPath = initCiWorkflow(targetPath);
    console.log(chalk.green(`Wrote workflow to ${workflowPath}`));
    return;
  }

  const result = await runCi(targetPath);
  console.log(JSON.stringify(result.report, null, 2));
  process.exit(result.exitCode);
}
