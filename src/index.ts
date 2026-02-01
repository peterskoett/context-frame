// Context Frame - AI Context Maturity Measurement CLI

export { scanRepository, analyzeFileContent } from './services/scanner';
export type { DetectedFile, ScanResult, ReferenceValidationResult } from './services/scanner';

export { calculateScore } from './services/scorer';
export type { ScoreResult, QualityMetrics } from './services/scorer';

export { MATURITY_LEVELS, getLevelByNumber } from './models/levels';
export type { MaturityLevel } from './models/levels';

export { FILE_PATTERNS, getPatternsByTool, getPatternsByLevel } from './models/patterns';
export type { FilePattern } from './models/patterns';

export { loadConfig } from './services/config';
export { scanOrg } from './services/org-scanner';
// MCP server is ESM-only; use dynamic import: await import('context-frame/services/mcp-server')
