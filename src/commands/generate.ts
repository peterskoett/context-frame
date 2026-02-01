import chalk from 'chalk';
import { generateTemplate, TemplateName } from '../services/templates';

export async function generateCommand(template: TemplateName, targetPath: string): Promise<void> {
  console.log(chalk.cyan(`\nGenerating context templates (${template})...\n`));
  try {
    const created = generateTemplate(template, targetPath);
    console.log(chalk.green(`Generated ${created.length} files:`));
    for (const file of created) {
      console.log(chalk.gray(`- ${file}`));
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${(error as Error).message}`));
    process.exit(1);
  }
}
