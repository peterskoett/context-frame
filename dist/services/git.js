"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommitCounts = getCommitCounts;
const child_process_1 = require("child_process");
async function getCommitCounts(basePath, files) {
    if (!isGitRepo(basePath)) {
        return {};
    }
    const results = {};
    for (const file of files) {
        const count = getCommitCountForFile(basePath, file);
        results[file] = count;
    }
    return results;
}
function isGitRepo(basePath) {
    const result = (0, child_process_1.spawnSync)('git', ['-C', basePath, 'rev-parse', '--is-inside-work-tree'], {
        encoding: 'utf-8'
    });
    return result.status === 0 && result.stdout.trim() === 'true';
}
function getCommitCountForFile(basePath, filePath) {
    const result = (0, child_process_1.spawnSync)('git', ['-C', basePath, 'rev-list', '--count', 'HEAD', '--', filePath], {
        encoding: 'utf-8'
    });
    if (result.status !== 0) {
        return 0;
    }
    const parsed = Number(result.stdout.trim());
    return Number.isFinite(parsed) ? parsed : 0;
}
