import * as fs from 'fs-extra';
import * as path from 'node:path';

export async function uninstall(cwd: string, purgeWorkspace: boolean = false): Promise<number> {
  const targets = [
    '.claude/skills/reforge-diff',
    '.claude/skills/reforge-impl',
    '.claude/skills/reforge-init',
    '.claude/skills/reforge-plan',
    '.claude/skills/reforge-render',
    '.claude/skills/reforge-resume',
    '.claude/skills/reforge-status',
    '.claude/skills/reforge-update',
    '.claude/skills/reforge-validate',
    '.claude/skills/reforge-verify',
    '.agents/skills/reforge-diff',
    '.agents/skills/reforge-impl',
    '.agents/skills/reforge-init',
    '.agents/skills/reforge-plan',
    '.agents/skills/reforge-render',
    '.agents/skills/reforge-resume',
    '.agents/skills/reforge-status',
    '.agents/skills/reforge-update',
    '.agents/skills/reforge-validate',
    '.agents/skills/reforge-verify',
  ];

  let removed = 0;
  for (const target of targets) {
    const targetPath = path.join(cwd, target);
    if (await fs.pathExists(targetPath)) {
      await fs.remove(targetPath);
      removed++;
      console.log(`Removed ${target}`);
    }
  }

  const serverPath = path.join(cwd, '.reforge/server');
  if (await fs.pathExists(serverPath)) {
    await fs.remove(serverPath);
    removed++;
    console.log(`Removed .reforge/server`);
  }
  
  if (purgeWorkspace) {
    const workspacePath = path.join(cwd, '.reforge');
    if (await fs.pathExists(workspacePath)) {
      await fs.remove(workspacePath);
      removed++;
      console.log(`Removed .reforge workspace completely`);
    }
  } else {
    console.log('Workspace data in .reforge/ was kept intact.');
  }

  console.log(`Uninstall complete. Removed ${removed} components.`);
  return 0;
}
