import chalk from 'chalk';
import { createContextPr } from '../services/pr';

export async function prCommand(repo: string): Promise<void> {
  console.log(chalk.cyan(`\nCreating PR for ${repo}...\n`));
  try {
    await createContextPr(repo);
    console.log(chalk.green('PR created successfully.'));
  } catch (error) {
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}
