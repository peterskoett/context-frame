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
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanRepository = scanRepository;
exports.analyzeFileContent = analyzeFileContent;
exports.analyzeTextContent = analyzeTextContent;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const glob_1 = require("glob");
const patterns_1 = require("../models/patterns");
const config_1 = require("./config");
const minimatch_1 = require("minimatch");
const git_1 = require("./git");
async function scanRepository(basePath) {
    const absolutePath = path.resolve(basePath);
    if (!fs.existsSync(absolutePath)) {
        throw new Error(`Path does not exist: ${absolutePath}`);
    }
    const config = (0, config_1.loadConfig)(absolutePath);
    const detectedFiles = [];
    const toolsDetected = new Set();
    let totalFilesScanned = 0;
    const skipPatterns = config.skipPatterns ?? [];
    for (const pattern of patterns_1.FILE_PATTERNS) {
        if (config.tools && !config.tools.includes(pattern.tool)) {
            continue;
        }
        for (const filePattern of pattern.patterns) {
            const isDirectory = filePattern.endsWith('/');
            const searchPattern = isDirectory
                ? filePattern.slice(0, -1)
                : filePattern;
            const fullPattern = path.join(absolutePath, searchPattern);
            try {
                if (isDirectory) {
                    const dirPath = path.join(absolutePath, searchPattern);
                    if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
                        if (shouldSkip(searchPattern, skipPatterns)) {
                            continue;
                        }
                        detectedFiles.push({
                            path: searchPattern,
                            pattern,
                            exists: true
                        });
                        toolsDetected.add(pattern.tool);
                        totalFilesScanned++;
                    }
                }
                else if (filePattern.includes('*')) {
                    const matches = await (0, glob_1.glob)(fullPattern, { nodir: true, ignore: skipPatterns });
                    for (const match of matches) {
                        const relativePath = path.relative(absolutePath, match);
                        if (shouldSkip(relativePath, skipPatterns)) {
                            continue;
                        }
                        const stats = fs.statSync(match);
                        const content = fs.readFileSync(match, 'utf-8');
                        const metrics = analyzeTextContent(content);
                        detectedFiles.push({
                            path: relativePath,
                            pattern,
                            exists: true,
                            size: stats.size,
                            wordCount: metrics.wordCount,
                            metrics
                        });
                        toolsDetected.add(pattern.tool);
                        totalFilesScanned++;
                    }
                }
                else {
                    const filePath = path.join(absolutePath, filePattern);
                    if (fs.existsSync(filePath)) {
                        if (shouldSkip(filePattern, skipPatterns)) {
                            continue;
                        }
                        const stats = fs.statSync(filePath);
                        let wordCount = 0;
                        if (stats.isFile()) {
                            const content = fs.readFileSync(filePath, 'utf-8');
                            const metrics = analyzeTextContent(content);
                            wordCount = metrics.wordCount;
                            detectedFiles.push({
                                path: filePattern,
                                pattern,
                                exists: true,
                                size: stats.size,
                                wordCount,
                                metrics
                            });
                            toolsDetected.add(pattern.tool);
                            totalFilesScanned++;
                            continue;
                        }
                        detectedFiles.push({
                            path: filePattern,
                            pattern,
                            exists: true,
                            size: stats.size,
                            wordCount
                        });
                        toolsDetected.add(pattern.tool);
                        totalFilesScanned++;
                    }
                }
            }
            catch (error) {
                // Skip files we can't access
            }
        }
    }
    const referenceValidation = await validateReferences(absolutePath, skipPatterns);
    const commitCounts = await (0, git_1.getCommitCounts)(absolutePath, detectedFiles.map(file => file.path));
    return {
        basePath: absolutePath,
        detectedFiles,
        toolsDetected: Array.from(toolsDetected),
        totalFilesScanned,
        referenceValidation,
        commitCounts
    };
}
function analyzeFileContent(filePath) {
    if (!fs.existsSync(filePath)) {
        return { sections: 0, filePaths: 0, commands: 0, constraints: 0, wordCount: 0 };
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return analyzeTextContent(content);
}
function analyzeTextContent(content) {
    if (!content) {
        return { sections: 0, filePaths: 0, commands: 0, constraints: 0, wordCount: 0 };
    }
    // Count markdown sections (headers)
    const sections = (content.match(/^#+\s+/gm) || []).length;
    // Count file paths (patterns like src/, ./file, /path/to)
    const filePaths = (content.match(/(?:\.\/|\/|src\/|lib\/)[a-zA-Z0-9_\-\/\.]+/g) || []).length;
    // Count commands (backtick code or common command patterns)
    const commands = (content.match(/`[^`]+`/g) || []).length;
    // Count constraints (words like "must", "should", "never", "always")
    const constraints = (content.match(/\b(must|should|never|always|don't|do not|required|forbidden)\b/gi) || []).length;
    // Word count
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    return { sections, filePaths, commands, constraints, wordCount };
}
function shouldSkip(targetPath, skipPatterns) {
    return skipPatterns.some(pattern => (0, minimatch_1.minimatch)(targetPath, pattern, { dot: true }));
}
async function validateReferences(basePath, skipPatterns) {
    const markdownFiles = await (0, glob_1.glob)('**/*.md', {
        cwd: basePath,
        nodir: true,
        ignore: skipPatterns
    });
    const brokenReferences = [];
    let totalReferences = 0;
    let resolvedReferences = 0;
    for (const file of markdownFiles) {
        const fullPath = path.join(basePath, file);
        const content = fs.readFileSync(fullPath, 'utf-8');
        const references = extractReferences(content);
        for (const reference of references) {
            totalReferences += 1;
            const resolved = resolveReferencePath(basePath, file, reference);
            if (!resolved) {
                brokenReferences.push({
                    sourceFile: file,
                    reference,
                    resolvedPath: ''
                });
                continue;
            }
            if (fs.existsSync(resolved)) {
                resolvedReferences += 1;
            }
            else {
                brokenReferences.push({
                    sourceFile: file,
                    reference,
                    resolvedPath: path.relative(basePath, resolved)
                });
            }
        }
    }
    const resolutionRate = totalReferences === 0 ? 1 : resolvedReferences / totalReferences;
    return {
        totalReferences,
        resolvedReferences,
        resolutionRate,
        brokenReferences
    };
}
function extractReferences(content) {
    const results = new Set();
    const linkMatches = content.matchAll(/\]\(([^)]+)\)/g);
    for (const match of linkMatches) {
        const raw = match[1].trim();
        if (isSkippableReference(raw)) {
            continue;
        }
        results.add(stripAnchor(raw));
    }
    const inlineCodeMatches = content.matchAll(/`([^`]+)`/g);
    for (const match of inlineCodeMatches) {
        const raw = match[1].trim();
        if (!looksLikePath(raw) || isSkippableReference(raw)) {
            continue;
        }
        results.add(stripAnchor(raw));
    }
    return Array.from(results);
}
function looksLikePath(value) {
    return value.startsWith('./') || value.startsWith('../') || value.includes('/') || value.includes('\\');
}
function stripAnchor(value) {
    const hashIndex = value.indexOf('#');
    return hashIndex === -1 ? value : value.slice(0, hashIndex);
}
function isSkippableReference(value) {
    return (value.startsWith('http://') ||
        value.startsWith('https://') ||
        value.startsWith('mailto:') ||
        value.startsWith('#') ||
        value.startsWith('tel:'));
}
function resolveReferencePath(basePath, sourceFile, reference) {
    if (!reference) {
        return null;
    }
    if (path.isAbsolute(reference)) {
        return path.join(basePath, reference.replace(/^[\\/]+/, ''));
    }
    const sourceDir = path.dirname(path.join(basePath, sourceFile));
    return path.resolve(sourceDir, reference);
}
