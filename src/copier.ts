import * as fs from 'fs-extra';
import * as path from 'node:path';
import type { InstallError, PackageAssets } from './types';

export interface CopyResult {
  overwritten: string[];
  error?: InstallError;
}

export async function copyLocalSkills(
  cwd: string,
  assets: PackageAssets
): Promise<CopyResult> {
  const destDir = path.join(cwd, '.reforge/skills');
  try {
    await fs.ensureDir(destDir);
    await fs.copy(assets.coreSkillsDir, destDir, { overwrite: true });
    return { overwritten: [] };
  } catch (err: unknown) {
    const reason = err instanceof Error ? err.message : String(err);
    return {
      overwritten: [],
      error: { path: assets.coreSkillsDir, reason }
    };
  }
}

export async function copyRendererServer(
  cwd: string,
  assets: PackageAssets
): Promise<CopyResult> {
  const destDir = path.join(cwd, '.reforge/server');
  try {
    await fs.ensureDir(destDir);
    await fs.copy(assets.rendererServerEntry, destDir, { overwrite: true });
    return { overwritten: [] };
  } catch (err: unknown) {
    const reason = err instanceof Error ? err.message : String(err);
    return {
      overwritten: [],
      error: { path: assets.rendererServerEntry, reason }
    };
  }
}
