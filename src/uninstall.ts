import * as fs from 'fs-extra';
import * as path from 'node:path';

export async function uninstall(cwd: string, purgeWorkspace: boolean = false): Promise<number> {
  const targets = [
    '.claude/skills/keelson-answer',
    '.claude/skills/keel-design',
    '.claude/skills/keelson-diff',
    '.claude/skills/keel-impl',
    '.claude/skills/keelson-init',
    '.claude/skills/keel-plan',
    '.claude/skills/keel-proto',
    '.claude/skills/keelson-render',
    '.claude/skills/keel-requirements',
    '.claude/skills/keelson-resume',
    '.claude/skills/keelson-status',
    '.claude/skills/keel-us',
    '.claude/skills/keelson-update',
    '.claude/skills/keelson-validate',
    '.claude/skills/keelson-verify',
    '.agents/skills/keelson-answer',
    '.agents/skills/keel-design',
    '.agents/skills/keelson-diff',
    '.agents/skills/keel-impl',
    '.agents/skills/keelson-init',
    '.agents/skills/keel-plan',
    '.agents/skills/keel-proto',
    '.agents/skills/keelson-render',
    '.agents/skills/keel-requirements',
    '.agents/skills/keelson-resume',
    '.agents/skills/keelson-status',
    '.agents/skills/keel-us',
    '.agents/skills/keelson-update',
    '.agents/skills/keelson-validate',
    '.agents/skills/keelson-verify',
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

  const serverPath = path.join(cwd, '.keelson/server');
  if (await fs.pathExists(serverPath)) {
    await fs.remove(serverPath);
    removed++;
    console.log(`Removed .keelson/server`);
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
