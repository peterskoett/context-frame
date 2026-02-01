"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanCommand = scanCommand;
const chalk_1 = __importDefault(require("chalk"));
const scanner_1 = require("../services/scanner");
const scorer_1 = require("../services/scorer");
async function scanCommand(targetPath) {
    console.log(chalk_1.default.cyan('\n🔍 Scanning repository for AI context maturity...\n'));
    try {
        const scanResult = await (0, scanner_1.scanRepository)(targetPath);
        const score = (0, scorer_1.calculateScore)(scanResult);
        printTerminalReport(score, scanResult.basePath);
    }
    catch (error) {
        console.error(chalk_1.default.red(`Error: ${error.message}`));
        process.exit(1);
    }
}
function printTerminalReport(score, basePath) {
    // Header
    console.log(chalk_1.default.bold.white('═══════════════════════════════════════════════════════════════'));
    console.log(chalk_1.default.bold.cyan('                    CONTEXT FRAME REPORT'));
    console.log(chalk_1.default.bold.white('═══════════════════════════════════════════════════════════════\n'));
    // Path
    console.log(chalk_1.default.gray(`Repository: ${basePath}\n`));
    // Maturity Level with visual
    const levelColor = getLevelColor(score.maturityLevel);
    console.log(chalk_1.default.bold.white('MATURITY LEVEL'));
    console.log(levelColor(`  Level ${score.maturityLevel}: ${score.maturityName}`));
    console.log(chalk_1.default.gray(`  ${score.maturityDescription}\n`));
    // Level progress bar
    printLevelBar(score.maturityLevel);
    // Quality Score
    console.log(chalk_1.default.bold.white('\nQUALITY SCORE'));
    const scoreColor = score.qualityScore >= 7 ? chalk_1.default.green :
        score.qualityScore >= 4 ? chalk_1.default.yellow : chalk_1.default.red;
    console.log(scoreColor(`  ${score.qualityScore}/10`) + chalk_1.default.gray(` (Weight: ${score.totalWeight})`));
    printScoreBar(score.qualityScore);
    // Quality Metrics
    console.log(chalk_1.default.bold.white('\nQUALITY METRICS'));
    console.log(chalk_1.default.gray(`  Sections:    ${score.qualityMetrics.sections}`));
    console.log(chalk_1.default.gray(`  File Paths:  ${score.qualityMetrics.filePaths}`));
    console.log(chalk_1.default.gray(`  Commands:    ${score.qualityMetrics.commands}`));
    console.log(chalk_1.default.gray(`  Constraints: ${score.qualityMetrics.constraints}`));
    console.log(chalk_1.default.gray(`  Word Count:  ${score.qualityMetrics.wordCount}`));
    // Tool Breakdown
    console.log(chalk_1.default.bold.white('\nTOOL COVERAGE'));
    for (const [tool, data] of Object.entries(score.toolBreakdown)) {
        const toolColor = getToolColor(tool);
        console.log(toolColor(`  ${tool}`) + chalk_1.default.gray(` (weight: ${data.weight})`));
        for (const file of data.files) {
            console.log(chalk_1.default.gray(`    - ${file}`));
        }
    }
    if (Object.keys(score.toolBreakdown).length === 0) {
        console.log(chalk_1.default.gray('  No AI context files detected'));
    }
    // Recommendations
    if (score.recommendations.length > 0) {
        console.log(chalk_1.default.bold.white('\nRECOMMENDATIONS'));
        for (const rec of score.recommendations) {
            console.log(chalk_1.default.yellow(`  → ${rec}`));
        }
    }
    console.log(chalk_1.default.bold.white('\n═══════════════════════════════════════════════════════════════\n'));
}
function printLevelBar(level) {
    const bar = [];
    for (let i = 1; i <= 8; i++) {
        if (i <= level) {
            bar.push(getLevelColor(i)('█'));
        }
        else {
            bar.push(chalk_1.default.gray('░'));
        }
    }
    console.log('  ' + bar.join('') + chalk_1.default.gray(` ${level}/8`));
    // Level labels
    console.log(chalk_1.default.gray('  12345678'));
}
function printScoreBar(score) {
    const filled = Math.round(score);
    const empty = 10 - filled;
    const color = score >= 7 ? chalk_1.default.green : score >= 4 ? chalk_1.default.yellow : chalk_1.default.red;
    console.log('  ' + color('█'.repeat(filled)) + chalk_1.default.gray('░'.repeat(empty)));
}
function getLevelColor(level) {
    if (level <= 2)
        return chalk_1.default.red;
    if (level <= 4)
        return chalk_1.default.yellow;
    if (level <= 6)
        return chalk_1.default.green;
    return chalk_1.default.cyan;
}
function getToolColor(tool) {
    switch (tool) {
        case 'Claude Code': return chalk_1.default.magenta;
        case 'GitHub Copilot': return chalk_1.default.blue;
        case 'Cursor': return chalk_1.default.cyan;
        case 'OpenAI Codex': return chalk_1.default.green;
        default: return chalk_1.default.white;
    }
}
