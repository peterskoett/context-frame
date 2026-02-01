#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const scan_1 = require("./commands/scan");
const report_1 = require("./commands/report");
const agent_1 = require("./services/agent");
const program = new commander_1.Command();
program
    .name('context-frame')
    .description('Measure AI context maturity in your codebase')
    .version('1.0.0');
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
    .action(async (targetPath) => {
    await (0, scan_1.scanCommand)(targetPath);
});
program
    .command('report')
    .description('Generate detailed AI context report')
    .argument('[path]', 'Path to repository', '.')
    .option('-f, --format <format>', 'Output format: json, markdown, terminal', 'terminal')
    .action(async (targetPath, options) => {
    const format = options.format;
    if (!['json', 'markdown', 'terminal'].includes(format)) {
        console.error(`Invalid format: ${format}. Use json, markdown, or terminal.`);
        process.exit(1);
    }
    await (0, report_1.reportCommand)(targetPath, format);
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
