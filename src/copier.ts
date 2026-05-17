import * as fs from 'fs-extra';
import * as path from 'node:path';
import type { InstallError, PackageAssets, TargetEnvironment } from './types';
import { ALL_SKILLS, ENV_SKILL_DIR } from './types';
import { loadForwarderTemplate, renderForwarder } from './forwarder';

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

