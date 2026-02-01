import { scanRepository } from '../services/scanner';
import { calculateScore } from '../services/scorer';

export type BadgeStyle = 'flat' | 'plastic' | 'for-the-badge';

export async function badgeCommand(targetPath: string, style: BadgeStyle = 'flat'): Promise<void> {
  const scanResult = await scanRepository(targetPath);
  const score = calculateScore(scanResult);
  const color = getBadgeColor(score.maturityLevel);

  const label = encodeURIComponent('context frame');
  const message = encodeURIComponent(`level ${score.maturityLevel}`);
  const url = `https://img.shields.io/badge/${label}-${message}-${color}?style=${encodeURIComponent(style)}`;

  console.log(url);
  console.log(`![Context Frame](${url})`);
}

function getBadgeColor(level: number): string {
  if (level <= 2) return 'red';
  if (level <= 4) return 'yellow';
  if (level <= 6) return 'green';
  return 'blue';
}
