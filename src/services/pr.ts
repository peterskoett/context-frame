import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';
import { runAgentFlow } from './agent';

export async function createContextPr(repo: string): Promise<void> {
  ensureGh();
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'context-frame-'));
  const cloneResult = spawnSync('gh', ['repo', 'clone', repo, workspace], { encoding: 'utf-8' });
  if (cloneResult.status !== 0) {
    throw new Error(`Failed to clone ${repo}.`);
  }

  const branchName = `context-frame/${Date.now()}`;
  runGit(workspace, ['checkout', '-b', branchName]);

  await runAgentFlow(workspace, 'improve');

  runGit(workspace, ['add', '.']);
  runGit(workspace, ['commit', '-m', 'Add context documentation']);
  runGit(workspace, ['push', '-u', 'origin', branchName]);

  const prResult = spawnSync('gh', ['pr', 'create', '--title', 'Add context documentation', '--body', 'Automated context improvements.'], {
    cwd: workspace,
    encoding: 'utf-8'
  });
  if (prResult.status !== 0) {
    throw new Error('Failed to create PR.');
  }
}

function ensureGh(): void {
  const result = spawnSync('gh', ['--version'], { encoding: 'utf-8' });
  if (result.status !== 0) {
    throw new Error('GitHub CLI (gh) is required.');
  }
}

function runGit(cwd: string, args: string[]): void {
  const result = spawnSync('git', args, { cwd, encoding: 'utf-8' });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed.`);
  }
}
