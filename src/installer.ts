import * as fs from 'fs-extra';
import * as path from 'node:path';
import type { InstallError, InstallResult, PackageAssets } from './types';
import {
  ALL_SKILLS,
  KEELSON_DIR,
  KEELSON_FEATURES_DIR,
  KEELSON_SYSTEM_SKILLS_DIR
} from './types';
import { detect } from './detector';
import { copyLocalSkills, copyForwarders } from './copier';

const LEGACY_SKILLS_DIR = `${KEELSON_DIR}/skills`;
const LEGACY_RESERVED_DIRS = new Set(['skills', 'steering']);

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

async function ensureKeelsonDir(cwd: string): Promise<InstallError | undefined> {
  const keelsonDir = path.join(cwd, KEELSON_DIR);
  try {
    await fs.ensureDir(keelsonDir);
    return undefined;
  } catch (err: unknown) {
    return toInstallError(keelsonDir, err);
  }
}

async function migrateLegacyFeatureDirs(cwd: string): Promise<InstallError | undefined> {
  const keelsonDir = path.join(cwd, KEELSON_DIR);
  const featuresDir = path.join(cwd, KEELSON_FEATURES_DIR);
  try {
    if (await fs.pathExists(path.join(featuresDir, 'manifest.json'))) {
      return toInstallError(
        featuresDir,
        new Error("Cannot migrate legacy feature workspace named 'features' automatically.")
      );
    }
    await fs.ensureDir(featuresDir);

    const entries = await fs.readdir(keelsonDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name === 'features') {
        continue;
      }

      const legacyFeatureDir = path.join(keelsonDir, entry.name);
      if (!(await fs.pathExists(path.join(legacyFeatureDir, 'manifest.json')))) {
        continue;
      }
      if (LEGACY_RESERVED_DIRS.has(entry.name)) {
        return toInstallError(
          legacyFeatureDir,
          new Error(`Cannot migrate legacy feature workspace named '${entry.name}' automatically.`)
        );
      }

      const featureDir = path.join(featuresDir, entry.name);
      if (await fs.pathExists(featureDir)) {
        return toInstallError(
          legacyFeatureDir,
          new Error(`Cannot migrate legacy feature workspace because ${featureDir} already exists.`)
        );
      }
      await fs.move(legacyFeatureDir, featureDir, { overwrite: false });
    }
    return undefined;
  } catch (err: unknown) {
    return toInstallError(keelsonDir, err);
  }
}

async function ensureInstallDirs(cwd: string): Promise<InstallError | undefined> {
  const keelsonDir = path.join(cwd, KEELSON_DIR);
  try {
    await fs.ensureDir(path.join(cwd, KEELSON_SYSTEM_SKILLS_DIR));
    await fs.ensureDir(path.join(cwd, KEELSON_FEATURES_DIR));
    return undefined;
  } catch (err: unknown) {
    return toInstallError(keelsonDir, err);
  }
}

async function removeLegacySkillsDir(cwd: string): Promise<InstallError | undefined> {
  const legacySkillsDir = path.join(cwd, LEGACY_SKILLS_DIR);
  try {
    await fs.remove(legacySkillsDir);
    return undefined;
  } catch (err: unknown) {
    return toInstallError(legacySkillsDir, err);
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
    const rootError = await ensureKeelsonDir(cwd);
    if (rootError) {
      return emptyResult({ error: rootError });
    }
    const migrationError = await migrateLegacyFeatureDirs(cwd);
    if (migrationError) {
      return emptyResult({ error: migrationError });
    }
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
    const legacySkillsError = await removeLegacySkillsDir(cwd);
    if (legacySkillsError) {
      return emptyResult({ overwritten: allOverwritten, error: legacySkillsError });
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
