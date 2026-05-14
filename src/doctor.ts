import * as fs from 'fs-extra';
import * as path from 'node:path';
import { detect } from './detector';
import type { ArtifactRecord, ReforgeManifest } from './types';

const WORKSPACE_INTERNAL_DIRS = new Set(['skills', 'server']);

function isArtifactRecord(value: unknown): value is ArtifactRecord {
  const candidate = value as Partial<ArtifactRecord> | undefined;
  return (
    Boolean(candidate) &&
    typeof candidate?.path === 'string' &&
    typeof candidate?.phase === 'string' &&
    typeof candidate?.status === 'string'
  );
}

function isManifest(value: unknown): value is ReforgeManifest {
  const candidate = value as Partial<ReforgeManifest> | undefined;
  const artifacts = candidate?.artifacts as
    | Partial<Record<keyof ReforgeManifest['artifacts'], unknown>>
    | undefined;

  return (
    candidate?.version === 1 &&
    typeof candidate.feature === 'string' &&
    typeof candidate.currentPhase === 'string' &&
    Boolean(artifacts) &&
    isArtifactRecord(artifacts?.requirements) &&
    isArtifactRecord(artifacts?.userStories) &&
    isArtifactRecord(artifacts?.usMock) &&
    isArtifactRecord(artifacts?.design) &&
    isArtifactRecord(artifacts?.prototype) &&
    isArtifactRecord(artifacts?.plan)
  );
}

export async function doctor(cwd: string, json: boolean = false): Promise<number> {
  const issues: string[] = [];
  const warnings: string[] = [];

  // 1. Check Node version
  const nodeVersionMatch = /^v?(\d+)/.exec(process.version);
  if (!nodeVersionMatch || Number(nodeVersionMatch[1]) < 18) {
    issues.push(`Node.js version is ${process.version}, but 18 or newer is required.`);
  }

  // 2. Check workspace
  const isGit = await fs.pathExists(path.join(cwd, '.git'));
  if (!isGit) {
    warnings.push('Not a git repository. Reforge works best in a version-controlled directory.');
  }

  const environments = await detect(cwd);
  if (environments.length === 0) {
    warnings.push('No AI coding agent environment detected (.claude/ or .agents/). Reforge skills may not be visible.');
  }

  const hasReforge = await fs.pathExists(path.join(cwd, '.reforge'));
  if (!hasReforge) {
    warnings.push('Reforge is not installed in this repository. Run `npx aid-reforge install` first.');
  } else {
    const reforgeDir = path.join(cwd, '.reforge');
    const entries = await fs.readdir(reforgeDir, { withFileTypes: true });
    const featureDirs = entries.filter((entry) => {
      return entry.isDirectory() && !WORKSPACE_INTERNAL_DIRS.has(entry.name);
    });

    let manifestCount = 0;
    for (const entry of featureDirs) {
      const manifestPath = path.join(reforgeDir, entry.name, 'manifest.json');
      if (!(await fs.pathExists(manifestPath))) {
        warnings.push(`Feature workspace '${entry.name}' is missing manifest.json.`);
        continue;
      }

      manifestCount += 1;
      try {
        const manifest = await fs.readJson(manifestPath);
        if (!isManifest(manifest)) {
          warnings.push(`Feature workspace '${entry.name}' has an invalid manifest.json.`);
        }
      } catch (e) {
        issues.push(`Failed to read manifest.json for '${entry.name}': ${e}`);
      }
    }

    if (manifestCount === 0) {
      warnings.push('No Reforge feature manifests found. Start with `/reforge-requirements "<idea>"`.');
    }
  }

  if (json) {
    console.log(JSON.stringify({ issues, warnings, ready: issues.length === 0 }, null, 2));
  } else {
    if (issues.length === 0 && warnings.length === 0) {
      console.log('✅ Reforge environment is ready.');
    } else {
      if (issues.length > 0) {
        console.error('❌ Reforge environment has issues:');
        issues.forEach((issue) => console.error(`  - ${issue}`));
      }
      if (warnings.length > 0) {
        console.warn('⚠️ Reforge environment has warnings:');
        warnings.forEach((warn) => console.warn(`  - ${warn}`));
      }
    }
  }

  return issues.length > 0 ? 1 : 0;
}
