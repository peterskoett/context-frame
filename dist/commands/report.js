"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportCommand = reportCommand;
const chalk_1 = __importDefault(require("chalk"));
const scanner_1 = require("../services/scanner");
const scorer_1 = require("../services/scorer");
const levels_1 = require("../models/levels");
async function reportCommand(targetPath, format) {
    try {
        const scanResult = await (0, scanner_1.scanRepository)(targetPath);
        const score = (0, scorer_1.calculateScore)(scanResult);
        switch (format) {
            case 'json':
                printJsonReport(score, scanResult.basePath);
                break;
            case 'markdown':
                printMarkdownReport(score, scanResult.basePath);
                break;
            case 'terminal':
            default:
                // Reuse scan command's terminal output
                const { scanCommand } = await Promise.resolve().then(() => __importStar(require('./scan')));
                await scanCommand(targetPath);
                break;
        }
    }
    catch (error) {
        console.error(chalk_1.default.red(`Error: ${error.message}`));
        process.exit(1);
    }
}
function printJsonReport(score, basePath) {
    const report = {
        repository: basePath,
        timestamp: new Date().toISOString(),
        maturity: {
            level: score.maturityLevel,
            name: score.maturityName,
            description: score.maturityDescription
        },
        quality: {
            score: score.qualityScore,
            maxScore: 10,
            weight: score.totalWeight
        },
        metrics: score.qualityMetrics,
        tools: score.toolBreakdown,
        recommendations: score.recommendations,
        levels: levels_1.MATURITY_LEVELS.map(l => ({
            level: l.level,
            name: l.name,
            achieved: l.level <= score.maturityLevel
        }))
    };
    console.log(JSON.stringify(report, null, 2));
}
function printMarkdownReport(score, basePath) {
    const lines = [];
    lines.push('# Context Frame Report\n');
    lines.push(`**Repository:** \`${basePath}\`\n`);
    lines.push(`**Generated:** ${new Date().toISOString()}\n`);
    // Maturity Level
    lines.push('## Maturity Level\n');
    lines.push(`| Level | Status |`);
    lines.push(`|-------|--------|`);
    for (const level of levels_1.MATURITY_LEVELS) {
        const status = level.level <= score.maturityLevel ? '✅' : '⬜';
        const current = level.level === score.maturityLevel ? ' ← Current' : '';
        lines.push(`| ${level.level}. ${level.name} | ${status}${current} |`);
    }
    lines.push('');
    lines.push(`**Current Level:** ${score.maturityLevel} - ${score.maturityName}\n`);
    lines.push(`> ${score.maturityDescription}\n`);
    // Quality Score
    lines.push('## Quality Score\n');
    lines.push(`**Score:** ${score.qualityScore}/10\n`);
    lines.push(`**Total Weight:** ${score.totalWeight}\n`);
    // Progress bar in markdown
    const filled = Math.round(score.qualityScore);
    const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);
    lines.push(`\`${bar}\`\n`);
    // Metrics
    lines.push('## Quality Metrics\n');
    lines.push('| Metric | Value |');
    lines.push('|--------|-------|');
    lines.push(`| Sections | ${score.qualityMetrics.sections} |`);
    lines.push(`| File Paths | ${score.qualityMetrics.filePaths} |`);
    lines.push(`| Commands | ${score.qualityMetrics.commands} |`);
    lines.push(`| Constraints | ${score.qualityMetrics.constraints} |`);
    lines.push(`| Word Count | ${score.qualityMetrics.wordCount} |`);
    lines.push('');
    // Tool Coverage
    lines.push('## Tool Coverage\n');
    if (Object.keys(score.toolBreakdown).length === 0) {
        lines.push('*No AI context files detected*\n');
    }
    else {
        for (const [tool, data] of Object.entries(score.toolBreakdown)) {
            lines.push(`### ${tool}\n`);
            lines.push(`**Weight:** ${data.weight}\n`);
            lines.push('**Files:**');
            for (const file of data.files) {
                lines.push(`- \`${file}\``);
            }
            lines.push('');
        }
    }
    // Recommendations
    if (score.recommendations.length > 0) {
        lines.push('## Recommendations\n');
        for (const rec of score.recommendations) {
            lines.push(`- ${rec}`);
        }
        lines.push('');
    }
    // Footer
    lines.push('---');
    lines.push('*Generated by [Context Frame](https://github.com/context-frame)*');
    console.log(lines.join('\n'));
}
