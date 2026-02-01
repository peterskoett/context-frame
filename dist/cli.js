#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const scan_1 = require("./commands/scan");
const report_1 = require("./commands/report");
const agent_1 = require("./services/agent");
const chalk_1 = __importDefault(require("chalk"));
const mcp_1 = require("./commands/mcp");
const scan_org_1 = require("./commands/scan-org");
const generate_1 = require("./commands/generate");
const ci_1 = require("./commands/ci");
const eval_1 = require("./commands/eval");
const pr_1 = require("./commands/pr");
const BANNER = [
    '   ___            _            _     _____                         ',
    '  / __\\___  _ __ | |_ _____  _| |_  |  ___| __ __ _ _ __ ___   ___ ',
    " / /  / _ \\| '_ \\| __/ _ \\ \\/ / __| | |_ | '__/ _` | '_ ` _ \\ / _ \\",
    '/ /__| (_) | | | | ||  __/>  <| |_  |  _|| | | (_| | | | | | |  __/',
    '\\____/\\___/|_| |_|\\__\\___/_/\\_\\\\__| |_|  |_|  \\__,_|_| |_| |_|\\___|'
].join('\n');
const program = new commander_1.Command();
program
    .name('context-frame')
    .description('Measure AI context maturity in your codebase')
    .version('1.1.0');
program.hook('preAction', (thisCommand) => {
    console.log(chalk_1.default.cyan(BANNER));
    console.log(chalk_1.default.gray(`Version ${thisCommand.version()}\n`));
});
program
    .argument('[path]', 'Path to repository', '.')
    .action(async (targetPath) => {
    try {
        await (0, agent_1.runAgentFlow)(targetPath, 'default');
    }
    catch (error) {
        console.error(error.message);
        process.exit(1);
    }
});
program
    .command('scan')
    .description('Scan repository for AI proficiency level')
    .argument('[path]', 'Path to repository', '.')
    .option('-f, --format <format>', 'Output format: json, markdown, terminal, csv', 'terminal')
    .action(async (targetPath, options) => {
    const format = options.format;
    if (!['json', 'markdown', 'terminal', 'csv'].includes(format)) {
        console.error(`Invalid format: ${format}. Use json, markdown, terminal, or csv.`);
        process.exit(1);
    }
    await (0, scan_1.scanCommand)(targetPath, format);
});
program
    .command('scan-org')
    .description('Scan all repos in a GitHub org without cloning')
    .argument('<org-name>', 'GitHub organization name')
    .option('-f, --format <format>', 'Output format: json, markdown, terminal, csv', 'terminal')
    .action(async (orgName, options) => {
    const format = options.format;
    if (!['json', 'markdown', 'terminal', 'csv'].includes(format)) {
        console.error(`Invalid format: ${format}. Use json, markdown, terminal, or csv.`);
        process.exit(1);
    }
    await (0, scan_org_1.scanOrgCommand)(orgName, format);
});
program
    .command('report')
    .description('Generate detailed AI context report')
    .argument('[path]', 'Path to repository', '.')
    .option('-f, --format <format>', 'Output format: json, markdown, terminal, csv', 'terminal')
    .action(async (targetPath, options) => {
    const format = options.format;
    if (!['json', 'markdown', 'terminal', 'csv'].includes(format)) {
        console.error(`Invalid format: ${format}. Use json, markdown, terminal, or csv.`);
        process.exit(1);
    }
    await (0, report_1.reportCommand)(targetPath, format);
});
program
    .command('generate')
    .description('Generate context files from a template')
    .requiredOption('-t, --template <template>', 'Template: react, node, python, go, rust')
    .argument('[path]', 'Path to repository', '.')
    .action(async (targetPath, options) => {
    const allowed = ['react', 'node', 'python', 'go', 'rust'];
    if (!allowed.includes(options.template)) {
        console.error(`Invalid template: ${options.template}. Use ${allowed.join(', ')}.`);
        process.exit(1);
    }
    await (0, generate_1.generateCommand)(options.template, targetPath);
});
program
    .command('eval')
    .description('Evaluate instruction effectiveness')
    .argument('<config>', 'Path to evaluation config JSON')
    .argument('[path]', 'Path to repository', '.')
    .option('-f, --format <format>', 'Output format: json, markdown', 'json')
    .action(async (configPath, targetPath, options) => {
    const format = options.format;
    if (!['json', 'markdown'].includes(format)) {
        console.error(`Invalid format: ${format}. Use json or markdown.`);
        process.exit(1);
    }
    await (0, eval_1.evalCommand)(configPath, targetPath, format);
});
program
    .command('pr')
    .description('Generate context files and open a PR')
    .argument('<owner/repo>', 'GitHub repository')
    .action(async (repo) => {
    await (0, pr_1.prCommand)(repo);
});
program
    .command('ci')
    .description('CI-friendly scan with thresholds')
    .argument('[path]', 'Path to repository', '.')
    .option('--init', 'Write GitHub Actions workflow')
    .action(async (targetPath, options) => {
    await (0, ci_1.ciCommand)(targetPath, options);
});
program
    .command('mcp')
    .description('Start Context Frame MCP server (stdio)')
    .action(async () => {
    await (0, mcp_1.mcpCommand)();
});
program
    .command('improve')
    .description('Run agent-only improvement flow')
    .argument('[path]', 'Path to repository', '.')
    .action(async (targetPath) => {
    try {
        await (0, agent_1.runAgentFlow)(targetPath, 'improve');
    }
    catch (error) {
        console.error(error.message);
        process.exit(1);
    }
});
program.parse();
