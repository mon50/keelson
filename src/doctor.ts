import * as fs from 'fs-extra';
import * as path from 'node:path';
import { detect } from './detector';

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
    warnings.push('Reforge is not installed in this repository. Run `npx reforge install` first.');
  } else {
    // Check spec versions
    const specsDir = path.join(cwd, '.reforge', 'specs');
    if (await fs.pathExists(specsDir)) {
      const specs = await fs.readdir(specsDir);
      for (const specName of specs) {
        const specPath = path.join(specsDir, specName, 'spec.json');
        if (await fs.pathExists(specPath)) {
          try {
            const specData = await fs.readJson(specPath);
            if (!specData?.meta?.reforgeVersion) {
              warnings.push(`Spec '${specName}' is missing meta.reforgeVersion. Please update it to '1.0.0'.`);
            } else if (specData.meta.reforgeVersion !== '1.0.0') {
              warnings.push(`Spec '${specName}' has version ${specData.meta.reforgeVersion}, but CLI expects '1.0.0'.`);
            }
          } catch (e) {
            issues.push(`Failed to read spec.json for '${specName}': ${e}`);
          }
        }
      }
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
