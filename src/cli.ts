#!/usr/bin/env node

import { Command } from 'commander';
import { scanCommand } from './commands/scan';
import { reportCommand, ReportFormat } from './commands/report';
import { runAgentFlow } from './services/agent';

const program = new Command();

program
  .name('context-frame')
  .description('Measure AI context maturity in your codebase')
  .version('1.0.0');

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
