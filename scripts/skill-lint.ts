import * as fs from 'fs-extra';
import * as path from 'node:path';

const REQUIRED_SKILLS = [
  'reforge-init',
  'reforge-update',
  'reforge-resume',
  'reforge-diff',
  'reforge-validate',
  'reforge-render',
  'reforge-plan',
  'reforge-impl',
  'reforge-verify',
  'reforge-status'
];

async function lintSkills(baseDir: string, isCodex: boolean) {
  let hasErrors = false;
  for (const skillName of REQUIRED_SKILLS) {
    const skillPath = path.join(baseDir, skillName);
    if (!await fs.pathExists(skillPath)) {
      console.error(`❌ Missing skill directory: ${skillPath}`);
      hasErrors = true;
      continue;
    }

    const skillMdPath = path.join(skillPath, 'SKILL.md');
    if (!await fs.pathExists(skillMdPath)) {
      console.error(`❌ Missing SKILL.md in: ${skillPath}`);
      hasErrors = true;
      continue;
    }

    const content = await fs.readFile(skillMdPath, 'utf8');
    if (!content.includes('name: ' + skillName)) {
      console.error(`❌ Invalid or missing frontmatter name in: ${skillMdPath}`);
      hasErrors = true;
    }

    if (isCodex) {
      const yamlPath = path.join(skillPath, 'agents', 'openai.yaml');
      if (!await fs.pathExists(yamlPath)) {
        console.error(`❌ Missing agents/openai.yaml in: ${skillPath}`);
        hasErrors = true;
      }
    }
  }
  return hasErrors;
}

async function main() {
  const rootDir = process.cwd();
  console.log('Linting Claude skills...');
  const claudeErrors = await lintSkills(path.join(rootDir, '.claude', 'skills'), false);
  
  console.log('\nLinting Codex skills...');
  const codexErrors = await lintSkills(path.join(rootDir, '.agents', 'skills'), true);

  if (claudeErrors || codexErrors) {
    console.error('\n❌ Skill linting failed.');
    process.exit(1);
  } else {
    console.log('\n✅ Skill linting passed.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
