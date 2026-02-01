import * as fs from 'fs';
import * as path from 'path';
import { loadConfig } from './config';
import { scanRepository } from './scanner';
import { calculateScore } from './scorer';

const WORKFLOW_TEMPLATE = `name: Context Frame

on:
  pull_request:
  push:
    branches: [ main, master ]

jobs:
  context-frame:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npx context-frame ci .
`;

export async function runCi(targetPath: string): Promise<{ exitCode: number; report: Record<string, unknown> }> {
  const scanResult = await scanRepository(targetPath);
  const score = calculateScore(scanResult);
  const config = loadConfig(scanResult.basePath);

  const thresholds = config.thresholds ?? {};
  const minLevel = thresholds.minLevel ?? 0;
  const minQualityScore = thresholds.minQualityScore ?? 0;
  const minResolvedRefsRate = thresholds.minResolvedRefsRate ?? 0;

  const failReasons: string[] = [];
  if (score.maturityLevel < minLevel) {
    failReasons.push(`Level ${score.maturityLevel} < ${minLevel}`);
  }
  if (score.qualityScore < minQualityScore) {
    failReasons.push(`Quality ${score.qualityScore} < ${minQualityScore}`);
  }
  if (scanResult.referenceValidation.resolutionRate < minResolvedRefsRate) {
    failReasons.push(
      `Reference resolution ${Math.round(scanResult.referenceValidation.resolutionRate * 100)}% < ${Math.round(minResolvedRefsRate * 100)}%`
    );
  }

  const report = {
    repository: scanResult.basePath,
    maturityLevel: score.maturityLevel,
    qualityScore: score.qualityScore,
    referenceResolutionRate: scanResult.referenceValidation.resolutionRate,
    thresholds: {
      minLevel,
      minQualityScore,
      minResolvedRefsRate
    },
    failReasons
  };

  return { exitCode: failReasons.length > 0 ? 1 : 0, report };
}

export function initCiWorkflow(basePath: string): string {
  const workflowPath = path.join(basePath, '.github', 'workflows', 'context-frame.yml');
  fs.mkdirSync(path.dirname(workflowPath), { recursive: true });
  fs.writeFileSync(workflowPath, WORKFLOW_TEMPLATE, 'utf-8');
  return workflowPath;
}
