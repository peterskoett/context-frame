import { spawnSync } from 'child_process';

export async function getCommitCounts(
  basePath: string,
  files: string[]
): Promise<Record<string, number>> {
  if (!isGitRepo(basePath)) {
    return {};
  }

  const results: Record<string, number> = {};

  for (const file of files) {
    const count = getCommitCountForFile(basePath, file);
    results[file] = count;
  }

  return results;
}

function isGitRepo(basePath: string): boolean {
  const result = spawnSync('git', ['-C', basePath, 'rev-parse', '--is-inside-work-tree'], {
    encoding: 'utf-8'
  });
  return result.status === 0 && result.stdout.trim() === 'true';
}

function getCommitCountForFile(basePath: string, filePath: string): number {
  const result = spawnSync('git', ['-C', basePath, 'rev-list', '--count', 'HEAD', '--', filePath], {
    encoding: 'utf-8'
  });
  if (result.status !== 0) {
    return 0;
  }
  const parsed = Number(result.stdout.trim());
  return Number.isFinite(parsed) ? parsed : 0;
}
