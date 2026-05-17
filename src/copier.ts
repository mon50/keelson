import * as fs from 'fs-extra';
import * as path from 'node:path';
import type { InstallError, PackageAssets, TargetEnvironment } from './types';
import { ALL_SKILLS, ENV_SKILL_DIR } from './types';
import { loadForwarderTemplate, renderForwarder } from './forwarder';

const LEGACY_KEELSON_SKILLS = new Set<string>([
  'keelson-init',
  'keelson-resume',
  'keelson-answer',
  'keelson-update',
  'keelson-diff',
  'keelson-validate',
  'keelson-render',
  'keelson-verify',
  'keelson-status'
]);

export interface CopyResult {
  overwritten: string[];
  error?: InstallError;
}

export async function copyLocalSkills(
  cwd: string,
  assets: PackageAssets
): Promise<CopyResult> {
  const destDir = path.join(cwd, '.keelson/skills');
  try {
    await fs.ensureDir(destDir);
    await removeKnownLegacyKeelsonSkills(destDir);
    for (const skillName of ALL_SKILLS) {
      await fs.copy(path.join(assets.coreSkillsDir, skillName), path.join(destDir, skillName), {
        overwrite: true
      });
    }
    return { overwritten: [] };
  } catch (err: unknown) {
    const reason = err instanceof Error ? err.message : String(err);
    return {
      overwritten: [],
      error: { path: assets.coreSkillsDir, reason }
    };
  }
}

export async function copyForwarders(
  cwd: string,
  environment: TargetEnvironment,
  assets: PackageAssets
): Promise<CopyResult> {
  try {
    const template = await loadForwarderTemplate(assets.templatesDir, environment);
    const envSkillRoot = path.join(cwd, ENV_SKILL_DIR[environment]);
    await fs.ensureDir(envSkillRoot);
    await removeKnownLegacyKeelsonSkills(envSkillRoot);
    const overwritten: string[] = [];

    for (const skillName of ALL_SKILLS) {
      const renderedContent = renderForwarder({ environment, skillName, template });
      const skillDir = path.join(envSkillRoot, skillName);
      await fs.ensureDir(skillDir);
      const destPath = path.join(skillDir, 'SKILL.md');
      if (await fs.pathExists(destPath)) {
        overwritten.push(destPath);
      }
      await fs.writeFile(destPath, renderedContent);
    }

    return { overwritten };
  } catch (err: unknown) {
    const reason = err instanceof Error ? err.message : String(err);
    return {
      overwritten: [],
      error: { path: assets.templatesDir, reason }
    };
  }
}

async function removeKnownLegacyKeelsonSkills(skillsDir: string): Promise<void> {
  if (!(await fs.pathExists(skillsDir))) {
    return;
  }

  const entries = await fs.readdir(skillsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && LEGACY_KEELSON_SKILLS.has(entry.name)) {
      await fs.remove(path.join(skillsDir, entry.name));
    }
  }
}

export async function copyRendererServer(
  cwd: string,
  assets: PackageAssets
): Promise<CopyResult> {
  const destDir = path.join(cwd, '.keelson/server');
  try {
    await fs.ensureDir(destDir);
    await fs.copy(assets.rendererServerDir, destDir, { overwrite: true });
    return { overwritten: [] };
  } catch (err: unknown) {
    const reason = err instanceof Error ? err.message : String(err);
    return {
      overwritten: [],
      error: { path: assets.rendererServerDir, reason }
    };
  }
}
