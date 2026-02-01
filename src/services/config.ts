import * as fs from 'fs';
import * as path from 'path';
import yaml from 'js-yaml';

export interface ContextFrameConfig {
  tools?: string[];
  thresholds?: {
    minLevel?: number;
    minQualityScore?: number;
    minResolvedRefsRate?: number;
  };
  skipPatterns?: string[];
}

const DEFAULT_CONFIG: Required<Pick<ContextFrameConfig, 'skipPatterns'>> = {
  skipPatterns: ['**/node_modules/**', '**/.git/**', '**/dist/**']
};

export function loadConfig(basePath: string): ContextFrameConfig {
  const candidates = ['.context-frame.yaml', '.context-frame.yml'];
  for (const name of candidates) {
    const fullPath = path.join(basePath, name);
    if (!fs.existsSync(fullPath)) {
      continue;
    }
    const content = fs.readFileSync(fullPath, 'utf-8');
    const parsed = (yaml.load(content) ?? {}) as ContextFrameConfig;
    return normalizeConfig(parsed);
  }
  return normalizeConfig({});
}

function normalizeConfig(config: ContextFrameConfig): ContextFrameConfig {
  return {
    tools: config.tools,
    thresholds: config.thresholds,
    skipPatterns: config.skipPatterns?.length ? config.skipPatterns : DEFAULT_CONFIG.skipPatterns
  };
}
