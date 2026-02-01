import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { FILE_PATTERNS, FilePattern } from '../models/patterns';

export interface DetectedFile {
  path: string;
  pattern: FilePattern;
  exists: boolean;
  size?: number;
  wordCount?: number;
}

export interface ScanResult {
  basePath: string;
  detectedFiles: DetectedFile[];
  toolsDetected: string[];
  totalFilesScanned: number;
}

export async function scanRepository(basePath: string): Promise<ScanResult> {
  const absolutePath = path.resolve(basePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Path does not exist: ${absolutePath}`);
  }

  const detectedFiles: DetectedFile[] = [];
  const toolsDetected = new Set<string>();
  let totalFilesScanned = 0;

  for (const pattern of FILE_PATTERNS) {
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
        } else if (filePattern.includes('*')) {
          const matches = await glob(fullPattern, { nodir: true });
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
        } else {
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
      } catch (error) {
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

export function analyzeFileContent(filePath: string): {
  sections: number;
  filePaths: number;
  commands: number;
  constraints: number;
  wordCount: number;
} {
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
