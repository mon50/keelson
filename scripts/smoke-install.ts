import * as fs from 'fs-extra';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

async function main() {
  const rootDir = process.cwd();
  console.log('Running install smoke test...');

  // Mock an environment
  const testDir = path.join(rootDir, '.smoke-test');
  await fs.ensureDir(testDir);
  await fs.ensureDir(path.join(testDir, '.claude'));
  
  try {
    // Run install
    console.log('Installing Keelson in test directory...');
    execSync(`npx tsx ${path.join(rootDir, 'bin/cli.ts')} install`, { cwd: testDir, stdio: 'inherit' });

    // Check if skills are installed
    const claudeSkillsDir = path.join(testDir, '.claude', 'skills');
    if (!await fs.pathExists(claudeSkillsDir)) {
      throw new Error('Skills were not installed in .claude/skills');
    }

    const requirementsSkill = path.join(claudeSkillsDir, 'keel-requirements', 'SKILL.md');
    if (!await fs.pathExists(requirementsSkill)) {
      throw new Error('keel-requirements skill was not installed');
    }

    const canonicalSkill = path.join(
      testDir,
      '.keelson',
      'system',
      'skills',
      'keel-requirements',
      'SKILL.md'
    );
    if (!await fs.pathExists(canonicalSkill)) {
      throw new Error('Canonical skills were not installed in .keelson/system/skills');
    }

    if (!await fs.pathExists(path.join(testDir, '.keelson', 'features'))) {
      throw new Error('.keelson/features was not initialized');
    }

    const gitignorePath = path.join(testDir, '.gitignore');
    const gitignore = await fs.readFile(gitignorePath, 'utf8');
    if (!gitignore.split(/\r?\n/).includes('.keelson/')) {
      throw new Error('.keelson/ was not added to .gitignore');
    }

    // Run doctor
    console.log('Running doctor...');
    execSync(`npx tsx ${path.join(rootDir, 'bin/cli.ts')} doctor`, { cwd: testDir, stdio: 'inherit' });

    // Run uninstall
    console.log('Uninstalling Keelson...');
    execSync(`npx tsx ${path.join(rootDir, 'bin/cli.ts')} uninstall`, { cwd: testDir, stdio: 'inherit' });

    if (await fs.pathExists(claudeSkillsDir)) {
      const skillsLeft = await fs.readdir(claudeSkillsDir);
      if (skillsLeft.some(s => s.startsWith('keelson-'))) {
        throw new Error('Keelson skills were not uninstalled properly');
      }
    }

    console.log('✅ Smoke install passed.');
  } finally {
    await fs.remove(testDir);
  }
}

main().catch((err) => {
  console.error('❌ Smoke install failed:', err);
  process.exit(1);
});
