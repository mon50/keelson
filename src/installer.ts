import * as fs from 'fs-extra';
import * as path from 'node:path';
import type { InstallError, InstallResult, PackageAssets } from './types';
import { ALL_SKILLS } from './types';
import { detect } from './detector';
import { copyLocalSkills, copyForwarders } from './copier';

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
  const keelsonDir = path.join(cwd, '.keelson');
  try {
    await fs.ensureDir(path.join(keelsonDir, 'skills'));
    return undefined;
  } catch (err: unknown) {
    return toInstallError(keelsonDir, err);
  }
}

function hasKeelsonGitignoreEntry(content: string): boolean {
  return content.split(/\r?\n/).some((line) => {
    const trimmed = line.trim();
    return (
      trimmed === '.keelson' ||
      trimmed === '.keelson/' ||
      trimmed === '/.keelson' ||
      trimmed === '/.keelson/'
    );
  });
}

async function ensureKeelsonGitignored(cwd: string): Promise<InstallError | undefined> {
  const gitignorePath = path.join(cwd, '.gitignore');
  try {
    const content = (await fs.pathExists(gitignorePath))
      ? await fs.readFile(gitignorePath, 'utf8')
      : '';
    if (hasKeelsonGitignoreEntry(content)) {
      return undefined;
    }

    const separator = content.length > 0 && !content.endsWith('\n') ? '\n' : '';
    await fs.appendFile(gitignorePath, `${separator}.keelson/\n`);
    return undefined;
  } catch (err: unknown) {
    return toInstallError(gitignorePath, err);
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
    const gitignoreError = await ensureKeelsonGitignored(cwd);
    if (gitignoreError) {
      return emptyResult({ error: gitignoreError });
    }

    const localResult = await copyLocalSkills(cwd, assets);
    const allOverwritten: string[] = [...localResult.overwritten];
    if (localResult.error) {
      return emptyResult({ overwritten: allOverwritten, error: localResult.error });
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
      forwardingInstalled,
      overwritten: allOverwritten
    };
  } catch (err: unknown) {
    return emptyResult({ error: toInstallError(cwd, err) });
  }
}
