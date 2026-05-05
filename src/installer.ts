import * as fs from 'fs-extra';
import * as path from 'node:path';
import type { InstallError, InstallResult, PackageAssets } from './types';
import { ALL_SKILLS } from './types';
import { detect } from './detector';
import { copyLocalSkills, copyRendererServer, copyForwarders } from './copier';

export interface InstallOptions {
  assets?: PackageAssets;
}

function resolvePackagePath(primaryRelative: string, sourceRelative: string): string {
  const primary = path.resolve(__dirname, primaryRelative);
  if (fs.pathExistsSync(primary)) {
    return primary;
  }

  const sourceFallback = path.resolve(__dirname, sourceRelative);
  return fs.pathExistsSync(sourceFallback) ? sourceFallback : primary;
}

function resolveDefaultAssets(): PackageAssets {
  return {
    coreSkillsDir: resolvePackagePath('../../skills/core', '../skills/core'),
    templatesDir: resolvePackagePath('../../skills/templates', '../skills/templates'),
    rendererServerDir: resolvePackagePath(
      '../../reforge-renderer/dist',
      '../reforge-renderer/dist'
    ),
    packageRoot: resolvePackagePath('../..', '..')
  };
}

function toInstallError(filePath: string, err: unknown): InstallError {
  return {
    path: filePath,
    reason: err instanceof Error ? err.message : String(err)
  };
}

function emptyResult(overrides?: Partial<InstallResult>): InstallResult {
  return {
    success: false,
    skillsInstalled: [],
    forwardingInstalled: {},
    overwritten: [],
    ...overrides
  };
}

async function ensureInstallDirs(cwd: string): Promise<InstallError | undefined> {
  const reforgeDir = path.join(cwd, '.reforge');
  try {
    await fs.ensureDir(path.join(reforgeDir, 'skills'));
    await fs.ensureDir(path.join(reforgeDir, 'server'));
    return undefined;
  } catch (err: unknown) {
    return toInstallError(reforgeDir, err);
  }
}

export async function install(cwd: string, options?: InstallOptions): Promise<InstallResult> {
  const assets = options?.assets ?? resolveDefaultAssets();

  try {
    const environments = await detect(cwd);
    const initError = await ensureInstallDirs(cwd);
    if (initError) {
      return emptyResult({ error: initError });
    }

    const localResult = await copyLocalSkills(cwd, assets);
    const allOverwritten: string[] = [...localResult.overwritten];
    if (localResult.error) {
      return emptyResult({ overwritten: allOverwritten, error: localResult.error });
    }

    const rendererResult = await copyRendererServer(cwd, assets);
    allOverwritten.push(...rendererResult.overwritten);
    if (rendererResult.error) {
      return emptyResult({ overwritten: allOverwritten, error: rendererResult.error });
    }

    const forwardingInstalled: InstallResult['forwardingInstalled'] = {};
    for (const env of environments) {
      const fwdResult = await copyForwarders(cwd, env, assets);
      allOverwritten.push(...fwdResult.overwritten);
      if (fwdResult.error) {
        return emptyResult({ overwritten: allOverwritten, error: fwdResult.error });
      }
      forwardingInstalled[env] = [...ALL_SKILLS];
    }

    return {
      success: true,
      skillsInstalled: [...ALL_SKILLS],
      rendererServerInstalled: path.join(cwd, '.reforge/server'),
      forwardingInstalled,
      overwritten: allOverwritten
    };
  } catch (err: unknown) {
    return emptyResult({ error: toInstallError(cwd, err) });
  }
}
