import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  FORWARDER_TEMPLATE_FILE,
  loadForwarderTemplate,
  renderForwarder
} from '../src/forwarder';
import { ALL_SKILLS, SKILL_COMMAND, TARGET_ENVIRONMENTS } from '../src/types';

const repoRoot = path.resolve(__dirname, '..');
const templatesDir = path.join(repoRoot, 'skills', 'templates');

function frontmatterOf(markdown: string): string {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(markdown);
  if (!match) {
    throw new Error(`Missing frontmatter:\n${markdown}`);
  }
  return match[1];
}

describe('installable forwarder templates', () => {
  it('ships one source template for every supported agent environment', () => {
    expect(FORWARDER_TEMPLATE_FILE).toEqual({
      'claude-code': 'claude-code.md',
      codex: 'codex.md'
    });

    for (const environment of TARGET_ENVIRONMENTS) {
      const templatePath = path.join(templatesDir, FORWARDER_TEMPLATE_FILE[environment]);
      expect(fs.existsSync(templatePath), templatePath).toBe(true);
    }
  });

  it('renders complete Claude Code SKILL.md forwarders for every supported skill', async () => {
    const template = await loadForwarderTemplate(templatesDir, 'claude-code');

    for (const skillName of ALL_SKILLS) {
      const markdown = renderForwarder({
        environment: 'claude-code',
        skillName,
        template
      });
      const frontmatter = frontmatterOf(markdown);

      expect(markdown).not.toContain('{{');
      expect(frontmatter).toContain(`name: ${skillName}`);
      expect(frontmatter).toContain(
        `description: Keelson ${SKILL_COMMAND[skillName]} command forwarding to the project-local SSoT skill.`
      );
      expect(frontmatter).toContain(
        'allowed-tools: Read, Bash, Write, Edit, Glob, AskUserQuestion'
      );
      expect(markdown).toContain(`# ${skillName}`);
      expect(markdown).toContain(`.keelson/skills/${skillName}/SKILL.md`);
      expect(markdown).toContain('follow its instructions exactly');
      expect(markdown).toContain('npx keelson install');
    }
  });

  it('renders complete Codex SKILL.md forwarders for every supported skill', async () => {
    const template = await loadForwarderTemplate(templatesDir, 'codex');

    for (const skillName of ALL_SKILLS) {
      const markdown = renderForwarder({
        environment: 'codex',
        skillName,
        template
      });
      const frontmatter = frontmatterOf(markdown);

      expect(markdown).not.toContain('{{');
      expect(frontmatter).toContain(`name: ${skillName}`);
      expect(frontmatter).toContain(
        `description: Keelson ${SKILL_COMMAND[skillName]} command forwarding to the project-local SSoT skill.`
      );
      expect(frontmatter).not.toContain('allowed-tools:');
      expect(markdown).toContain(`# ${skillName}`);
      expect(markdown).toContain(`.keelson/skills/${skillName}/SKILL.md`);
      expect(markdown).toContain('follow its instructions exactly');
      expect(markdown).toContain('npx keelson install');
    }
  });

  it('only renders Claude Code argument hints for commands that accept arguments', async () => {
    const template = await loadForwarderTemplate(templatesDir, 'claude-code');

    expect(
      frontmatterOf(
        renderForwarder({
          environment: 'claude-code',
          skillName: 'keel-requirements',
          template
        })
      )
    ).toContain('argument-hint: "\\"<idea>\\""');
    expect(
      frontmatterOf(
        renderForwarder({
          environment: 'claude-code',
          skillName: 'keel-us',
          template
        })
      )
    ).not.toContain('argument-hint:');
    expect(
      frontmatterOf(
        renderForwarder({
          environment: 'claude-code',
          skillName: 'keel-proto',
          template
        })
      )
    ).not.toContain('argument-hint:');
    expect(
      frontmatterOf(
        renderForwarder({
          environment: 'claude-code',
          skillName: 'keel-impl',
          template
        })
      )
    ).toContain('argument-hint: "[task-id]"');
  });
});
