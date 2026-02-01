"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanOrg = scanOrg;
const child_process_1 = require("child_process");
const patterns_1 = require("../models/patterns");
const scanner_1 = require("./scanner");
const minimatch_1 = require("minimatch");
async function scanOrg(org) {
    const repos = listRepos(org);
    const results = [];
    for (const repo of repos) {
        const detectedFiles = await scanRepoWithoutClone(repo);
        results.push({ name: repo, detectedFiles });
    }
    return { org, repos: results };
}
function listRepos(org) {
    const result = (0, child_process_1.spawnSync)('gh', ['repo', 'list', org, '--limit', '200', '--json', 'nameWithOwner'], {
        encoding: 'utf-8'
    });
    if (result.status !== 0) {
        throw new Error(`Failed to list repos for ${org}. Ensure gh is installed and authenticated.`);
    }
    const parsed = JSON.parse(result.stdout.trim());
    return parsed.map((repo) => repo.nameWithOwner);
}
async function scanRepoWithoutClone(repo) {
    const tree = getRepoTree(repo);
    const detectedFiles = [];
    for (const pattern of patterns_1.FILE_PATTERNS) {
        for (const filePattern of pattern.patterns) {
            const isDirectory = filePattern.endsWith('/');
            const searchPattern = isDirectory ? filePattern.slice(0, -1) : filePattern;
            if (isDirectory) {
                const exists = tree.some(entry => entry.path.startsWith(`${searchPattern}/`));
                if (exists) {
                    detectedFiles.push({
                        path: searchPattern,
                        pattern,
                        exists: true
                    });
                }
                continue;
            }
            if (filePattern.includes('*')) {
                const matches = tree.filter(entry => entry.type === 'blob' && (0, minimatch_1.minimatch)(entry.path, searchPattern));
                for (const match of matches) {
                    const content = await fetchFileContent(repo, match.path);
                    const metrics = (0, scanner_1.analyzeTextContent)(content ?? '');
                    detectedFiles.push({
                        path: match.path,
                        pattern,
                        exists: true,
                        size: match.size ?? undefined,
                        wordCount: metrics.wordCount,
                        metrics
                    });
                }
                continue;
            }
            const match = tree.find(entry => entry.path === searchPattern);
            if (match) {
                const content = await fetchFileContent(repo, match.path);
                const metrics = (0, scanner_1.analyzeTextContent)(content ?? '');
                detectedFiles.push({
                    path: match.path,
                    pattern,
                    exists: true,
                    size: match.size ?? undefined,
                    wordCount: metrics.wordCount,
                    metrics
                });
            }
        }
    }
    return detectedFiles;
}
function getRepoTree(repo) {
    const infoResult = (0, child_process_1.spawnSync)('gh', ['api', `repos/${repo}`], { encoding: 'utf-8' });
    if (infoResult.status !== 0) {
        throw new Error(`Failed to fetch repo metadata for ${repo}.`);
    }
    const info = JSON.parse(infoResult.stdout.trim());
    const defaultBranch = info.default_branch;
    const treeResult = (0, child_process_1.spawnSync)('gh', ['api', `repos/${repo}/git/trees/${defaultBranch}?recursive=1`], {
        encoding: 'utf-8'
    });
    if (treeResult.status !== 0) {
        throw new Error(`Failed to fetch repo tree for ${repo}.`);
    }
    const tree = JSON.parse(treeResult.stdout.trim());
    return tree.tree || [];
}
async function fetchFileContent(repo, filePath) {
    const result = (0, child_process_1.spawnSync)('gh', ['api', `repos/${repo}/contents/${filePath}`], { encoding: 'utf-8' });
    if (result.status !== 0) {
        return null;
    }
    const payload = JSON.parse(result.stdout.trim());
    if (!payload.content) {
        return null;
    }
    const buffer = Buffer.from(payload.content, 'base64');
    return buffer.toString('utf-8');
}
