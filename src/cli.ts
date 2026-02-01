#!/usr/bin/env node

import { Command } from 'commander';
import { scanCommand, ScanFormat } from './commands/scan';
import { reportCommand, ReportFormat } from './commands/report';
import { runAgentFlow } from './services/agent';
import chalk from 'chalk';
import { mcpCommand } from './commands/mcp';
import { scanOrgCommand, OrgReportFormat } from './commands/scan-org';
import { generateCommand } from './commands/generate';
import { ciCommand } from './commands/ci';
import { evalCommand, EvalFormat } from './commands/eval';
import { prCommand } from './commands/pr';
import { badgeCommand, BadgeStyle } from './commands/badge';
import { diffCommand } from './commands/diff';
import { tuiCommand, listPatterns, listLevels } from './commands/tui';

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
  .version('1.1.0');

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
  .option('-f, --format <format>', 'Output format: json, markdown, terminal, csv, sarif', 'terminal')
  .option('-w, --watch', 'Watch for file changes and rescan')
  .action(async (targetPath: string, options: { format: string; watch?: boolean }) => {
    const format = options.format as ScanFormat;
    if (!['json', 'markdown', 'terminal', 'csv', 'sarif'].includes(format)) {
      console.error(`Invalid format: ${format}. Use json, markdown, terminal, csv, or sarif.`);
      process.exit(1);
    }
    await scanCommand(targetPath, format, Boolean(options.watch));
  });

program
  .command('scan-org')
  .description('Scan all repos in a GitHub org without cloning')
  .argument('<org-name>', 'GitHub organization name')
  .option('-f, --format <format>', 'Output format: json, markdown, terminal, csv', 'terminal')
  .action(async (orgName: string, options: { format: string }) => {
    const format = options.format as OrgReportFormat;
    if (!['json', 'markdown', 'terminal', 'csv'].includes(format)) {
      console.error(`Invalid format: ${format}. Use json, markdown, terminal, or csv.`);
      process.exit(1);
    }
    await scanOrgCommand(orgName, format);
  });

program
  .command('report')
  .description('Generate detailed AI context report')
  .argument('[path]', 'Path to repository', '.')
  .option('-f, --format <format>', 'Output format: json, markdown, terminal, csv', 'terminal')
  .action(async (targetPath: string, options: { format: string }) => {
    const format = options.format as ReportFormat;
    if (!['json', 'markdown', 'terminal', 'csv'].includes(format)) {
      console.error(`Invalid format: ${format}. Use json, markdown, terminal, or csv.`);
      process.exit(1);
    }
    await reportCommand(targetPath, format);
  });

program
  .command('badge')
  .description('Generate a shields.io badge for the current maturity level')
  .argument('[path]', 'Path to repository', '.')
  .option('-s, --style <style>', 'Badge style: flat, plastic, for-the-badge', 'flat')
  .action(async (targetPath: string, options: { style: string }) => {
    const style = options.style as BadgeStyle;
    if (!['flat', 'plastic', 'for-the-badge'].includes(style)) {
      console.error(`Invalid style: ${style}. Use flat, plastic, or for-the-badge.`);
      process.exit(1);
    }
    await badgeCommand(targetPath, style);
  });

program
  .command('diff')
  .description('Compare current scan results to a saved baseline JSON')
  .argument('<baseline.json>', 'Path to baseline JSON file')
  .argument('[path]', 'Path to repository', '.')
  .action(async (baselinePath: string, targetPath: string) => {
    try {
      await diffCommand(baselinePath, targetPath);
    } catch (error) {
      console.error((error as Error).message);
      process.exit(1);
    }
  });

program
  .command('generate')
  .description('Generate context files from a template')
  .requiredOption('-t, --template <template>', 'Template: react, node, python, go, rust')
  .argument('[path]', 'Path to repository', '.')
  .action(async (targetPath: string, options: { template: string }) => {
    const allowed = ['react', 'node', 'python', 'go', 'rust'];
    if (!allowed.includes(options.template)) {
      console.error(`Invalid template: ${options.template}. Use ${allowed.join(', ')}.`);
      process.exit(1);
    }
    await generateCommand(options.template as any, targetPath);
  });

program
  .command('eval')
  .description('Evaluate instruction effectiveness')
  .argument('<config>', 'Path to evaluation config JSON')
  .argument('[path]', 'Path to repository', '.')
  .option('-f, --format <format>', 'Output format: json, markdown', 'json')
  .action(async (configPath: string, targetPath: string, options: { format: string }) => {
    const format = options.format as EvalFormat;
    if (!['json', 'markdown'].includes(format)) {
      console.error(`Invalid format: ${format}. Use json or markdown.`);
      process.exit(1);
    }
    await evalCommand(configPath, targetPath, format);
  });

program
  .command('pr')
  .description('Generate context files and open a PR')
  .argument('<owner/repo>', 'GitHub repository')
  .action(async (repo: string) => {
    await prCommand(repo);
  });

program
  .command('ci')
  .description('CI-friendly scan with thresholds')
  .argument('[path]', 'Path to repository', '.')
  .option('--init', 'Write GitHub Actions workflow')
  .action(async (targetPath: string, options: { init?: boolean }) => {
    await ciCommand(targetPath, options);
  });

program
  .command('mcp')
  .description('Start Context Frame MCP server (stdio)')
  .action(async () => {
    await mcpCommand();
  });

program
  .command('tui')
  .description('Interactive TUI for browsing scan results')
  .argument('[path]', 'Path to repository', '.')
  .action(async (targetPath: string) => {
    await tuiCommand(targetPath);
  });

program
  .command('patterns')
  .description('List all detection patterns')
  .action(() => {
    listPatterns();
  });

program
  .command('levels')
  .description('List all maturity levels')
  .action(() => {
    listLevels();
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
