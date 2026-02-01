import { spawnSync } from 'child_process';
import { FILE_PATTERNS } from '../models/patterns';
import { DetectedFile, analyzeTextContent } from './scanner';
import { minimatch } from 'minimatch';

export interface OrgRepoScan {
  name: string;
  detectedFiles: DetectedFile[];
}

export interface OrgScanResult {
  org: string;
  repos: OrgRepoScan[];
}

export async function scanOrg(org: string): Promise<OrgScanResult> {
  const repos = listRepos(org);
  const results: OrgRepoScan[] = [];

  for (const repo of repos) {
    const detectedFiles = await scanRepoWithoutClone(repo);
    results.push({ name: repo, detectedFiles });
  }

  return { org, repos: results };
}

function listRepos(org: string): string[] {
  const result = spawnSync('gh', ['repo', 'list', org, '--limit', '200', '--json', 'nameWithOwner'], {
    encoding: 'utf-8'
  });
  if (result.status !== 0) {
    throw new Error(`Failed to list repos for ${org}. Ensure gh is installed and authenticated.`);
  }
  const parsed = JSON.parse(result.stdout.trim());
  return parsed.map((repo: { nameWithOwner: string }) => repo.nameWithOwner);
}

async function scanRepoWithoutClone(repo: string): Promise<DetectedFile[]> {
  const tree = getRepoTree(repo);
  const detectedFiles: DetectedFile[] = [];

  for (const pattern of FILE_PATTERNS) {
    for (const filePattern of pattern.patterns) {
      const isDirectory = filePattern.endsWith('/');
      const searchPattern = isDirectory ? filePattern.slice(0, -1) : filePattern;
      if (isDirectory) {
        const exists = tree.some(entry => entry.path.startsWith(`${searchPattern}/`));
        if (exists) {
          detectedFiles.push({
            path: searchPattern,
            pattern,
            exists: true
          });
        }
        continue;
      }

      if (filePattern.includes('*')) {
        const matches = tree.filter(entry => entry.type === 'blob' && minimatch(entry.path, searchPattern));
        for (const match of matches) {
          const content = await fetchFileContent(repo, match.path);
          const metrics = analyzeTextContent(content ?? '');
          detectedFiles.push({
            path: match.path,
            pattern,
            exists: true,
            size: match.size ?? undefined,
            wordCount: metrics.wordCount,
            metrics
          });
        }
        continue;
      }

      const match = tree.find(entry => entry.path === searchPattern);
      if (match) {
        const content = await fetchFileContent(repo, match.path);
        const metrics = analyzeTextContent(content ?? '');
        detectedFiles.push({
          path: match.path,
          pattern,
          exists: true,
          size: match.size ?? undefined,
          wordCount: metrics.wordCount,
          metrics
        });
      }
    }
  }

  return detectedFiles;
}

function getRepoTree(repo: string): Array<{ path: string; type: string; size?: number }> {
  const infoResult = spawnSync('gh', ['api', `repos/${repo}`], { encoding: 'utf-8' });
  if (infoResult.status !== 0) {
    throw new Error(`Failed to fetch repo metadata for ${repo}.`);
  }
  const info = JSON.parse(infoResult.stdout.trim());
  const defaultBranch = info.default_branch;

  const treeResult = spawnSync('gh', ['api', `repos/${repo}/git/trees/${defaultBranch}?recursive=1`], {
    encoding: 'utf-8'
  });
  if (treeResult.status !== 0) {
    throw new Error(`Failed to fetch repo tree for ${repo}.`);
  }
  const tree = JSON.parse(treeResult.stdout.trim());
  return tree.tree || [];
}

async function fetchFileContent(repo: string, filePath: string): Promise<string | null> {
  const result = spawnSync('gh', ['api', `repos/${repo}/contents/${filePath}`], { encoding: 'utf-8' });
  if (result.status !== 0) {
    return null;
  }
  const payload = JSON.parse(result.stdout.trim());
  if (!payload.content) {
    return null;
  }
  const buffer = Buffer.from(payload.content, 'base64');
  return buffer.toString('utf-8');
}
