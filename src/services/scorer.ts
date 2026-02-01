import { ScanResult, DetectedFile, analyzeFileContent } from './scanner';
import { MATURITY_LEVELS, MaturityLevel } from '../models/levels';
import * as path from 'path';

export interface QualityMetrics {
  sections: number;
  filePaths: number;
  commands: number;
  constraints: number;
  wordCount: number;
}

export interface ScoreResult {
  maturityLevel: number;
  maturityName: string;
  maturityDescription: string;
  qualityScore: number;
  totalWeight: number;
  toolBreakdown: Record<string, { files: string[]; weight: number }>;
  qualityMetrics: QualityMetrics;
  recommendations: string[];
}

export function calculateScore(scanResult: ScanResult): ScoreResult {
  const toolBreakdown: Record<string, { files: string[]; weight: number }> = {};
  let totalWeight = 0;
  let maxLevelReached = 1;
  const levelsSatisfied = new Set<number>([1]);

  // Aggregate quality metrics
  const qualityMetrics: QualityMetrics = {
    sections: 0,
    filePaths: 0,
    commands: 0,
    constraints: 0,
    wordCount: 0
  };

  // Process detected files
  for (const detected of scanResult.detectedFiles) {
    const tool = detected.pattern.tool;

    if (!toolBreakdown[tool]) {
      toolBreakdown[tool] = { files: [], weight: 0 };
    }

    toolBreakdown[tool].files.push(detected.path);
    toolBreakdown[tool].weight += detected.pattern.weight;
    totalWeight += detected.pattern.weight;

    // Track which levels are satisfied
    levelsSatisfied.add(detected.pattern.level);

    // Analyze content quality for markdown files
    if (detected.path.endsWith('.md')) {
      const fullPath = path.join(scanResult.basePath, detected.path);
      const metrics = analyzeFileContent(fullPath);
      qualityMetrics.sections += metrics.sections;
      qualityMetrics.filePaths += metrics.filePaths;
      qualityMetrics.commands += metrics.commands;
      qualityMetrics.constraints += metrics.constraints;
      qualityMetrics.wordCount += metrics.wordCount;
    } else if (detected.wordCount) {
      qualityMetrics.wordCount += detected.wordCount;
    }
  }

  // Determine maturity level - highest level with files detected
  // (More generous: show progress even if lower levels incomplete)
  for (let level = 8; level >= 1; level--) {
    if (levelsSatisfied.has(level)) {
      maxLevelReached = level;
      break;
    }
  }

  // Calculate quality score (0-10)
  const qualityScore = calculateQualityScore(qualityMetrics, totalWeight);

  // Generate recommendations
  const recommendations = generateRecommendations(scanResult, maxLevelReached, qualityMetrics);

  const level = MATURITY_LEVELS.find(l => l.level === maxLevelReached) || MATURITY_LEVELS[0];

  return {
    maturityLevel: maxLevelReached,
    maturityName: level.name,
    maturityDescription: level.description,
    qualityScore,
    totalWeight,
    toolBreakdown,
    qualityMetrics,
    recommendations
  };
}

function calculateQualityScore(metrics: QualityMetrics, totalWeight: number): number {
  // Score components (each 0-2 points, total 10)
  const sectionScore = Math.min(metrics.sections / 5, 2);
  const filePathScore = Math.min(metrics.filePaths / 10, 2);
  const commandScore = Math.min(metrics.commands / 10, 2);
  const constraintScore = Math.min(metrics.constraints / 10, 2);
  const wordScore = Math.min(metrics.wordCount / 500, 2);

  const rawScore = sectionScore + filePathScore + commandScore + constraintScore + wordScore;
  return Math.round(rawScore * 10) / 10;
}

function generateRecommendations(
  scanResult: ScanResult,
  currentLevel: number,
  metrics: QualityMetrics
): string[] {
  const recommendations: string[] = [];

  // Level-based recommendations
  if (currentLevel < 2) {
    recommendations.push("Add a CLAUDE.md or .cursorrules file to provide basic AI instructions");
  }

  if (currentLevel < 3) {
    recommendations.push("Create ARCHITECTURE.md to document your system design");
    recommendations.push("Add CONVENTIONS.md to establish coding standards");
  }

  if (currentLevel < 4) {
    recommendations.push("Set up .claude/commands/ for custom automation");
    recommendations.push("Configure hooks for pre/post processing");
  }

  if (currentLevel < 5) {
    recommendations.push("Create AGENTS.md to define multi-agent workflows");
    recommendations.push("Add MCP configuration for external tool integration");
  }

  // Quality-based recommendations
  if (metrics.sections < 5) {
    recommendations.push("Add more sections to your documentation for better organization");
  }

  if (metrics.constraints < 5) {
    recommendations.push("Include more explicit constraints (must/should/never) for clearer guidance");
  }

  if (metrics.wordCount < 200) {
    recommendations.push("Expand your documentation with more detailed instructions");
  }

  // Tool coverage recommendations
  if (!scanResult.toolsDetected.includes("Claude Code")) {
    recommendations.push("Add CLAUDE.md for Claude Code support");
  }

  if (!scanResult.toolsDetected.includes("GitHub Copilot")) {
    recommendations.push("Add .github/copilot-instructions.md for Copilot support");
  }

  if (!scanResult.toolsDetected.includes("Cursor")) {
    recommendations.push("Add .cursorrules or .cursor/rules/ for Cursor support");
  }

  return recommendations.slice(0, 5); // Return top 5 recommendations
}
