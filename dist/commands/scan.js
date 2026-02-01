"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanCommand = scanCommand;
const chalk_1 = __importDefault(require("chalk"));
const scanner_1 = require("../services/scanner");
const scorer_1 = require("../services/scorer");
async function scanCommand(targetPath, format = 'terminal') {
    console.log(chalk_1.default.cyan('\n🔍 Scanning repository for AI context maturity...\n'));
    try {
        const scanResult = await (0, scanner_1.scanRepository)(targetPath);
        const score = (0, scorer_1.calculateScore)(scanResult);
        switch (format) {
            case 'json':
                printJsonReport(score, scanResult.basePath, scanResult);
                break;
            case 'markdown':
                printMarkdownReport(score, scanResult.basePath, scanResult);
                break;
            case 'csv':
                printCsvReport(score, scanResult.basePath, scanResult);
                break;
            case 'terminal':
            default:
                printTerminalReport(score, scanResult.basePath, scanResult);
                break;
        }
    }
    catch (error) {
        console.error(chalk_1.default.red(`Error: ${error.message}`));
        process.exit(1);
    }
}
function printTerminalReport(score, basePath, scanResult) {
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
    if (score.commitBonus > 0) {
        console.log(chalk_1.default.gray(`  Commit Bonus: +${score.commitBonus.toFixed(1)}`));
    }
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
    // Reference validation
    console.log(chalk_1.default.bold.white('\nREFERENCE VALIDATION'));
    const ref = scanResult.referenceValidation;
    const resolvedColor = ref.resolutionRate >= 0.9 ? chalk_1.default.green : ref.resolutionRate >= 0.7 ? chalk_1.default.yellow : chalk_1.default.red;
    console.log(resolvedColor(`  ${ref.resolvedReferences}/${ref.totalReferences} refs resolved (${Math.round(ref.resolutionRate * 100)}%)`));
    if (ref.brokenReferences.length > 0) {
        console.log(chalk_1.default.gray(`  Broken refs: ${ref.brokenReferences.length}`));
    }
    // Commit history
    console.log(chalk_1.default.bold.white('\nCONTEXT FILE HISTORY'));
    const commitCounts = scanResult.commitCounts;
    const trackedFiles = Object.keys(commitCounts);
    const bonusFiles = trackedFiles.filter(file => commitCounts[file] >= 5).length;
    console.log(chalk_1.default.gray(`  Files tracked: ${trackedFiles.length}`));
    console.log(chalk_1.default.gray(`  Files with 5+ commits: ${bonusFiles}`));
    const topFiles = trackedFiles
        .map(file => ({ file, count: commitCounts[file] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    if (topFiles.length > 0) {
        console.log(chalk_1.default.gray('  Top files:'));
        for (const entry of topFiles) {
            console.log(chalk_1.default.gray(`    - ${entry.file}: ${entry.count} commits`));
        }
    }
    console.log(chalk_1.default.bold.white('\n═══════════════════════════════════════════════════════════════\n'));
}
function printJsonReport(score, basePath, scanResult) {
    const report = buildReportData(score, basePath, scanResult);
    console.log(JSON.stringify(report, null, 2));
}
function printMarkdownReport(score, basePath, scanResult) {
    const report = buildReportData(score, basePath, scanResult);
    const lines = [];
    lines.push('# Context Frame Report\n');
    lines.push(`**Repository:** \`${report.repository}\`\n`);
    lines.push(`**Generated:** ${report.timestamp}\n`);
    lines.push(`**Level:** ${report.maturity.level} - ${report.maturity.name}\n`);
    lines.push(`**Quality:** ${report.quality.score}/10 (bonus: +${report.quality.commitBonus})\n`);
    lines.push('## Reference Validation\n');
    lines.push(`Resolved: ${report.references.resolved}/${report.references.total} (${Math.round(report.references.rate * 100)}%)\n`);
    if (report.references.broken.length > 0) {
        lines.push('Broken references:');
        for (const broken of report.references.broken.slice(0, 10)) {
            lines.push(`- ${broken.sourceFile} -> ${broken.reference}`);
        }
        lines.push('');
    }
    lines.push('## Commit History\n');
    lines.push(`Files tracked: ${report.commits.files}\n`);
    lines.push(`Files with 5+ commits: ${report.commits.filesWithFivePlus}\n`);
    console.log(lines.join('\n'));
}
function printCsvReport(score, basePath, scanResult) {
    const report = buildReportData(score, basePath, scanResult);
    const headers = [
        'repository',
        'timestamp',
        'level',
        'quality_score',
        'commit_bonus',
        'refs_total',
        'refs_resolved',
        'refs_rate',
        'context_files',
        'context_files_5plus'
    ];
    const row = [
        report.repository,
        report.timestamp,
        report.maturity.level,
        report.quality.score,
        report.quality.commitBonus,
        report.references.total,
        report.references.resolved,
        report.references.rate.toFixed(2),
        report.commits.files,
        report.commits.filesWithFivePlus
    ];
    console.log(headers.join(','));
    console.log(row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','));
}
function buildReportData(score, basePath, scanResult) {
    const ref = scanResult.referenceValidation;
    const commitCounts = scanResult.commitCounts;
    const filesWithFivePlus = Object.values(commitCounts).filter(count => count >= 5).length;
    return {
        repository: basePath,
        timestamp: new Date().toISOString(),
        maturity: {
            level: score.maturityLevel,
            name: score.maturityName,
            description: score.maturityDescription
        },
        quality: {
            score: score.qualityScore,
            commitBonus: score.commitBonus
        },
        references: {
            total: ref.totalReferences,
            resolved: ref.resolvedReferences,
            rate: ref.resolutionRate,
            broken: ref.brokenReferences
        },
        commits: {
            files: Object.keys(commitCounts).length,
            filesWithFivePlus,
            counts: commitCounts
        }
    };
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
