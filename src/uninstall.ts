import * as fs from 'fs-extra';
import * as path from 'node:path';
import { ALL_SKILLS, ENV_SKILL_DIR, TARGET_ENVIRONMENTS } from './types';

export async function uninstall(cwd: string, purgeWorkspace: boolean = false): Promise<number> {
  const targets = TARGET_ENVIRONMENTS.flatMap((env) =>
    ALL_SKILLS.map((skill) => `${ENV_SKILL_DIR[env]}/${skill}`)
  );

  let removed = 0;
  for (const target of targets) {
    const targetPath = path.join(cwd, target);
    if (await fs.pathExists(targetPath)) {
      await fs.remove(targetPath);
      removed++;
      console.log(`Removed ${target}`);
    }
  }

  if (purgeWorkspace) {
    const workspacePath = path.join(cwd, '.keelson');
    if (await fs.pathExists(workspacePath)) {
      await fs.remove(workspacePath);
      removed++;
      console.log(`Removed .keelson workspace completely`);
    }
  } else {
    console.log('Workspace data in .keelson/ was kept intact.');
  }

  console.log(`Uninstall complete. Removed ${removed} components.`);
  return 0;
}
