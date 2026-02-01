#!/usr/bin/env node

import { Command } from 'commander';
import { scanCommand } from './commands/scan';
import { reportCommand, ReportFormat } from './commands/report';
import { runAgentFlow } from './services/agent';
import chalk from 'chalk';

const BANNER = [
  '   ___            _            _     _____                         ',
  '  / __\\___  _ __ | |_ _____  _| |_  |  ___| __ __ _ _ __ ___   ___ ',
  " / /  / _ \\| '_ \\| __/ _ \\ \\/ / __| | |_ | '__/ _` | '_ ` _ \\ / _ \\",
  '/ /__| (_) | | | | ||  __/>  <| |_  |  _|| | | (_| | | | | | |  __/',
  '\\____/\\___/|_| |_|\\__\\___/_/\\_\\\\__| |_|  |_|  \\__,_|_| |_| |_|\\___|'
].join('\n');

const program = new Command();

program
  .name('context-frame')
  .description('Measure AI context maturity in your codebase')
  .version('1.0.0');

program.hook('preAction', (thisCommand) => {
  console.log(chalk.cyan(BANNER));
  console.log(chalk.gray(`Version ${thisCommand.version()}\n`));
});

program
  .argument('[path]', 'Path to repository', '.')
  .action(async (targetPath: string) => {
    try {
      await runAgentFlow(targetPath, 'default');
    } catch (error) {
      console.error((error as Error).message);
      process.exit(1);
    }
  });

program
  .command('scan')
  .description('Scan repository for AI proficiency level')
  .argument('[path]', 'Path to repository', '.')
  .action(async (targetPath: string) => {
    await scanCommand(targetPath);
  });

program
  .command('report')
  .description('Generate detailed AI context report')
  .argument('[path]', 'Path to repository', '.')
  .option('-f, --format <format>', 'Output format: json, markdown, terminal', 'terminal')
  .action(async (targetPath: string, options: { format: string }) => {
    const format = options.format as ReportFormat;
    if (!['json', 'markdown', 'terminal'].includes(format)) {
      console.error(`Invalid format: ${format}. Use json, markdown, or terminal.`);
      process.exit(1);
    }
    await reportCommand(targetPath, format);
  });

program
  .command('improve')
  .description('Run agent-only improvement flow')
  .argument('[path]', 'Path to repository', '.')
  .action(async (targetPath: string) => {
    try {
      await runAgentFlow(targetPath, 'improve');
    } catch (error) {
      console.error((error as Error).message);
      process.exit(1);
    }
  });

program.parse();
