"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.evalCommand = evalCommand;
const chalk_1 = __importDefault(require("chalk"));
const evaluator_1 = require("../services/evaluator");
async function evalCommand(configPath, targetPath, format = 'json') {
    console.log(chalk_1.default.cyan('\nRunning evaluation...\n'));
    try {
        const results = await (0, evaluator_1.runEvaluation)(configPath, targetPath);
        if (format === 'markdown') {
            const lines = [];
            lines.push('# Context Frame Evaluation\n');
            for (const result of results) {
                lines.push(`## ${result.promptId}`);
                lines.push(`**Score (no context):** ${result.judge.scoreWithout}`);
                lines.push(`**Score (with context):** ${result.judge.scoreWith}`);
                lines.push(`**Verdict:** ${result.judge.verdict}\n`);
            }
            console.log(lines.join('\n'));
        }
        else {
            console.log(JSON.stringify({ results }, null, 2));
        }
    }
    catch (error) {
        console.error(chalk_1.default.red(`Error: ${error.message}`));
        process.exit(1);
    }
}
