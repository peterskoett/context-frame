"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportCommand = reportCommand;
const chalk_1 = __importDefault(require("chalk"));
const scanner_1 = require("../services/scanner");
const scorer_1 = require("../services/scorer");
const levels_1 = require("../models/levels");
const scan_1 = require("./scan");
async function reportCommand(targetPath, format) {
    try {
        const scanResult = await (0, scanner_1.scanRepository)(targetPath);
        const score = (0, scorer_1.calculateScore)(scanResult);
        switch (format) {
            case 'json':
                printJsonReport(score, scanResult);
                break;
            case 'markdown':
                printMarkdownReport(score, scanResult);
                break;
            case 'csv':
                printCsvReport(score, scanResult);
                break;
            case 'terminal':
            default:
                await (0, scan_1.scanCommand)(targetPath, format);
                break;
        }
    }
    catch (error) {
        console.error(chalk_1.default.red(`Error: ${error.message}`));
        process.exit(1);
    }
}
function printJsonReport(score, scanResult) {
    const report = {
        repository: scanResult.basePath,
        timestamp: new Date().toISOString(),
        maturity: {
            level: score.maturityLevel,
            name: score.maturityName,
            description: score.maturityDescription
        },
        quality: {
            score: score.qualityScore,
            maxScore: 10,
            weight: score.totalWeight,
            commitBonus: score.commitBonus
        },
        metrics: score.qualityMetrics,
        tools: score.toolBreakdown,
        references: scanResult.referenceValidation,
        commits: scanResult.commitCounts,
        recommendations: score.recommendations,
        levels: levels_1.MATURITY_LEVELS.map(l => ({
            level: l.level,
            name: l.name,
            achieved: l.level <= score.maturityLevel
        }))
    };
    console.log(JSON.stringify(report, null, 2));
}
function printMarkdownReport(score, scanResult) {
    const lines = [];
    lines.push('# Context Frame Report\n');
    lines.push(`**Repository:** \`${scanResult.basePath}\`\n`);
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
    lines.push(`**Commit Bonus:** ${score.commitBonus}\n`);
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
    lines.push('## Reference Validation\n');
    lines.push(`Resolved: ${scanResult.referenceValidation.resolvedReferences}/${scanResult.referenceValidation.totalReferences} (${Math.round(scanResult.referenceValidation.resolutionRate * 100)}%)\n`);
    if (scanResult.referenceValidation.brokenReferences.length > 0) {
        lines.push('Broken References:');
        for (const broken of scanResult.referenceValidation.brokenReferences.slice(0, 10)) {
            lines.push(`- ${broken.sourceFile} -> ${broken.reference}`);
        }
        lines.push('');
    }
    // Footer
    lines.push('---');
    lines.push('*Generated by [Context Frame](https://github.com/context-frame)*');
    console.log(lines.join('\n'));
}
function printCsvReport(score, scanResult) {
    const headers = [
        'repository',
        'timestamp',
        'level',
        'level_name',
        'quality_score',
        'quality_weight',
        'commit_bonus',
        'sections',
        'file_paths',
        'commands',
        'constraints',
        'word_count',
        'tools_detected',
        'refs_total',
        'refs_resolved',
        'refs_rate',
        'context_files',
        'context_files_5plus'
    ];
    const commitCounts = scanResult.commitCounts;
    const filesWithFivePlus = Object.values(commitCounts).filter(count => count >= 5).length;
    const row = [
        scanResult.basePath,
        new Date().toISOString(),
        score.maturityLevel,
        score.maturityName,
        score.qualityScore,
        score.totalWeight,
        score.commitBonus,
        score.qualityMetrics.sections,
        score.qualityMetrics.filePaths,
        score.qualityMetrics.commands,
        score.qualityMetrics.constraints,
        score.qualityMetrics.wordCount,
        scanResult.toolsDetected.length,
        scanResult.referenceValidation.totalReferences,
        scanResult.referenceValidation.resolvedReferences,
        scanResult.referenceValidation.resolutionRate.toFixed(2),
        Object.keys(commitCounts).length,
        filesWithFivePlus
    ];
    console.log(headers.join(','));
    console.log(row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','));
}
