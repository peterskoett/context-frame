import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { scanRepository } from '../services/scanner';
import { calculateScore, ScoreResult } from '../services/scorer';

interface BaselineMetrics {
  level: number | null;
  quality: number | null;
  weight: number | null;
}

export async function diffCommand(baselinePath: string, targetPath: string = '.'): Promise<void> {
  const resolvedBaseline = path.resolve(baselinePath);
  if (!fs.existsSync(resolvedBaseline)) {
    throw new Error(`Baseline file not found: ${resolvedBaseline}`);
  }

  const raw = fs.readFileSync(resolvedBaseline, 'utf-8');
  const baselineData = JSON.parse(raw);
  const baseline = extractBaselineMetrics(baselineData);

  const scanResult = await scanRepository(targetPath);
  const currentScore = calculateScore(scanResult);
  const current: BaselineMetrics = {
    level: currentScore.maturityLevel,
    quality: currentScore.qualityScore,
    weight: currentScore.totalWeight
  };

  console.log(chalk.bold('CONTEXT FRAME DIFF'));
  console.log(chalk.gray(`Baseline: ${resolvedBaseline}`));
  console.log(chalk.gray(`Current:  ${scanResult.basePath}\n`));

  printMetric('Level', baseline.level, current.level, 0);
  printMetric('Quality', baseline.quality, current.quality, 1);
  printMetric('Weight', baseline.weight, current.weight, 0);
}

function extractBaselineMetrics(data: any): BaselineMetrics {
  if (!data || typeof data !== 'object') {
    return { level: null, quality: null, weight: null };
  }

  if (data.scanResult) {
    try {
      const score = data.score && isScoreResult(data.score)
        ? data.score
        : calculateScore(data.scanResult);
      return {
        level: score.maturityLevel,
        quality: score.qualityScore,
        weight: score.totalWeight
      };
    } catch {
      // Fallback to manual extraction below
    }
  }

  const level = coerceNumber(
    data.maturity?.level ??
      data.maturityLevel ??
      data.level ??
      data.score?.maturityLevel ??
      data.score?.maturity?.level
  );

  const quality = coerceNumber(
    data.quality?.score ??
      data.qualityScore ??
      data.score?.qualityScore ??
      data.score?.quality?.score
  );

  const weight = coerceNumber(
    data.quality?.weight ??
      data.quality?.totalWeight ??
      data.totalWeight ??
      data.score?.totalWeight ??
      data.score?.quality?.weight
  );

  return { level, quality, weight };
}

function isScoreResult(value: any): value is ScoreResult {
  return value && typeof value.maturityLevel === 'number' && typeof value.qualityScore === 'number';
}

function coerceNumber(value: any): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function printMetric(label: string, baseline: number | null, current: number | null, decimals: number): void {
  const baselineText = formatValue(baseline, decimals);
  const currentText = formatValue(current, decimals);
  const delta = baseline !== null && current !== null ? current - baseline : null;
  const deltaText = formatDelta(delta, decimals);

  console.log(`${label.padEnd(8)} ${baselineText} -> ${currentText} ${deltaText}`);
}

function formatValue(value: number | null, decimals: number): string {
  if (value === null) {
    return 'n/a';
  }
  return value.toFixed(decimals);
}

function formatDelta(value: number | null, decimals: number): string {
  if (value === null) {
    return chalk.gray('(n/a)');
  }
  if (value === 0) {
    return chalk.gray('(no change)');
  }
  const sign = value > 0 ? '+' : '';
  const formatted = `${sign}${value.toFixed(decimals)}`;
  return value > 0 ? chalk.green(`(${formatted})`) : chalk.red(`(${formatted})`);
}
