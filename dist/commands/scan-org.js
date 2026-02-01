"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanOrgCommand = scanOrgCommand;
const chalk_1 = __importDefault(require("chalk"));
const org_scanner_1 = require("../services/org-scanner");
const scorer_1 = require("../services/scorer");
async function scanOrgCommand(org, format = 'terminal') {
    console.log(chalk_1.default.cyan(`\n[scan] Scanning GitHub org: ${org}\n`));
    try {
        const orgResult = await (0, org_scanner_1.scanOrg)(org);
        const summaries = orgResult.repos.map(repo => {
            const scanResult = {
                basePath: repo.name,
                detectedFiles: repo.detectedFiles,
                toolsDetected: Array.from(new Set(repo.detectedFiles.map(file => file.pattern.tool))),
                totalFilesScanned: repo.detectedFiles.length,
                referenceValidation: {
                    totalReferences: 0,
                    resolvedReferences: 0,
                    resolutionRate: 1,
                    brokenReferences: []
                },
                commitCounts: {}
            };
            const score = (0, scorer_1.calculateScore)(scanResult);
            return { repo: repo.name, score };
        });
        switch (format) {
            case 'json':
                console.log(JSON.stringify({ org, summaries }, null, 2));
                break;
            case 'markdown':
                printMarkdown(org, summaries);
                break;
            case 'csv':
                printCsv(org, summaries);
                break;
            case 'terminal':
            default:
                printTerminal(org, summaries);
                break;
        }
    }
    catch (error) {
        console.error(chalk_1.default.red(`Error: ${error.message}`));
        process.exit(1);
    }
}
function printTerminal(org, summaries) {
    console.log(chalk_1.default.bold.white(`Org: ${org}`));
    for (const summary of summaries) {
        console.log(chalk_1.default.gray(`- ${summary.repo}: Level ${summary.score.maturityLevel} (${summary.score.maturityName}), ${summary.score.qualityScore}/10`));
    }
}
function printMarkdown(org, summaries) {
    const lines = [];
    lines.push(`# Context Frame Org Report`);
    lines.push(`**Org:** ${org}`);
    lines.push('');
    lines.push('| Repo | Level | Quality |');
    lines.push('|------|-------|---------|');
    for (const summary of summaries) {
        lines.push(`| ${summary.repo} | ${summary.score.maturityLevel} | ${summary.score.qualityScore}/10 |`);
    }
    console.log(lines.join('\n'));
}
function printCsv(org, summaries) {
    console.log('org,repo,level,quality_score');
    for (const summary of summaries) {
        console.log(`"${org}","${summary.repo}","${summary.score.maturityLevel}","${summary.score.qualityScore}"`);
    }
}
