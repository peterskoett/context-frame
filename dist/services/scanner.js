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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const glob_1 = require("glob");
const patterns_1 = require("../models/patterns");
async function scanRepository(basePath) {
    const absolutePath = path.resolve(basePath);
    if (!fs.existsSync(absolutePath)) {
        throw new Error(`Path does not exist: ${absolutePath}`);
    }
    const detectedFiles = [];
    const toolsDetected = new Set();
    let totalFilesScanned = 0;
    for (const pattern of patterns_1.FILE_PATTERNS) {
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
                    const matches = await (0, glob_1.glob)(fullPattern, { nodir: true });
                    for (const match of matches) {
                        const relativePath = path.relative(absolutePath, match);
                        const stats = fs.statSync(match);
                        const content = fs.readFileSync(match, 'utf-8');
                        const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
                        detectedFiles.push({
                            path: relativePath,
                            pattern,
                            exists: true,
                            size: stats.size,
                            wordCount
                        });
                        toolsDetected.add(pattern.tool);
                        totalFilesScanned++;
                    }
                }
                else {
                    const filePath = path.join(absolutePath, filePattern);
                    if (fs.existsSync(filePath)) {
                        const stats = fs.statSync(filePath);
                        let wordCount = 0;
                        if (stats.isFile()) {
                            const content = fs.readFileSync(filePath, 'utf-8');
                            wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
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
    return {
        basePath: absolutePath,
        detectedFiles,
        toolsDetected: Array.from(toolsDetected),
        totalFilesScanned
    };
}
function analyzeFileContent(filePath) {
    if (!fs.existsSync(filePath)) {
        return { sections: 0, filePaths: 0, commands: 0, constraints: 0, wordCount: 0 };
    }
    const content = fs.readFileSync(filePath, 'utf-8');
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
