import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { TargetEnvironment } from './types';

async function dirExists(dirPath: string): Promise<boolean> {
  try {
    await fs.stat(dirPath);
    return true;
  } catch {
    return false;
  }
}

export async function detect(cwd: string): Promise<readonly TargetEnvironment[]> {
  const environments: TargetEnvironment[] = [];

  if (await dirExists(path.join(cwd, '.claude'))) {
    environments.push('claude-code');
  }

  if (await dirExists(path.join(cwd, '.agents'))) {
    environments.push('codex');
  }

  if (environments.length === 0) {
    environments.push('claude-code');
  }

  return environments as readonly TargetEnvironment[];
}
