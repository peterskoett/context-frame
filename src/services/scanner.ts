import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { FILE_PATTERNS, FilePattern } from '../models/patterns';
import { loadConfig } from './config';
import { minimatch } from 'minimatch';
import { getCommitCounts } from './git';

export interface DetectedFile {
  path: string;
  pattern: FilePattern;
  exists: boolean;
  size?: number;
  wordCount?: number;
  metrics?: {
    sections: number;
    filePaths: number;
    commands: number;
    constraints: number;
    wordCount: number;
  };
}

export interface ReferenceIssue {
  sourceFile: string;
  reference: string;
  resolvedPath: string;
}

export interface ReferenceValidationResult {
  totalReferences: number;
  resolvedReferences: number;
  resolutionRate: number;
  brokenReferences: ReferenceIssue[];
}

export interface ScanResult {
  basePath: string;
  detectedFiles: DetectedFile[];
  toolsDetected: string[];
  totalFilesScanned: number;
  referenceValidation: ReferenceValidationResult;
  commitCounts: Record<string, number>;
}

export async function scanRepository(basePath: string): Promise<ScanResult> {
  const absolutePath = path.resolve(basePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Path does not exist: ${absolutePath}`);
  }

  const config = loadConfig(absolutePath);

  const detectedFiles: DetectedFile[] = [];
  const toolsDetected = new Set<string>();
  let totalFilesScanned = 0;

  const skipPatterns = config.skipPatterns ?? [];

  for (const pattern of FILE_PATTERNS) {
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
        } else if (filePattern.includes('*')) {
          const matches = await glob(fullPattern, { nodir: true, ignore: skipPatterns });
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
        } else {
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
      } catch (error) {
        // Skip files we can't access
      }
    }
  }

  const referenceValidation = await validateReferences(absolutePath, skipPatterns);
  const commitCounts = await getCommitCounts(
    absolutePath,
    detectedFiles.map(file => file.path)
  );

  return {
    basePath: absolutePath,
    detectedFiles,
    toolsDetected: Array.from(toolsDetected),
    totalFilesScanned,
    referenceValidation,
    commitCounts
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
  return analyzeTextContent(content);
}

export function analyzeTextContent(content: string): {
  sections: number;
  filePaths: number;
  commands: number;
  constraints: number;
  wordCount: number;
} {
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

function shouldSkip(targetPath: string, skipPatterns: string[]): boolean {
  return skipPatterns.some(pattern => minimatch(targetPath, pattern, { dot: true }));
}

async function validateReferences(
  basePath: string,
  skipPatterns: string[]
): Promise<ReferenceValidationResult> {
  const markdownFiles = await glob('**/*.md', {
    cwd: basePath,
    nodir: true,
    ignore: skipPatterns
  });

  const brokenReferences: ReferenceIssue[] = [];
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
      } else {
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

function extractReferences(content: string): string[] {
  const results = new Set<string>();

  const linkMatches = content.matchAll(/\]\(([^)]+)\)/g);
  for (const match of linkMatches) {
    const raw = match[1].trim();
    if (isSkippableReference(raw)) {
      continue;
    }
    results.add(stripAnchor(raw));
  }

  const contentWithoutFences = stripFencedCodeBlocks(content);
  const inlineCodeMatches = contentWithoutFences.matchAll(/`([^`]+)`/g);
  for (const match of inlineCodeMatches) {
    const raw = match[1].trim();
    if (!looksLikePath(raw) || isSkippableReference(raw)) {
      continue;
    }
    results.add(stripAnchor(raw));
  }

  return Array.from(results);
}

function stripFencedCodeBlocks(content: string): string {
  if (!content) {
    return content;
  }
  return content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/~~~[\s\S]*?~~~/g, '');
}

function looksLikePath(value: string): boolean {
  return value.startsWith('./') || value.startsWith('../') || value.includes('/') || value.includes('\\');
}

function stripAnchor(value: string): string {
  const hashIndex = value.indexOf('#');
  return hashIndex === -1 ? value : value.slice(0, hashIndex);
}

function isSkippableReference(value: string): boolean {
  return (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('mailto:') ||
    value.startsWith('#') ||
    value.startsWith('tel:')
  );
}

function resolveReferencePath(basePath: string, sourceFile: string, reference: string): string | null {
  if (!reference) {
    return null;
  }

  if (path.isAbsolute(reference)) {
    return path.join(basePath, reference.replace(/^[\\/]+/, ''));
  }

  const sourceDir = path.dirname(path.join(basePath, sourceFile));
  return path.resolve(sourceDir, reference);
}
