import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const implSkillPath = '.claude/skills/reforge-impl/SKILL.md';

function readImplSkill(): string {
  return readFileSync(resolve(process.cwd(), implSkillPath), 'utf8');
}

describe('reforge-impl Claude Code skill scaffold', () => {
  it('declares the required frontmatter for the optional entity argument', () => {
    expect(existsSync(resolve(process.cwd(), implSkillPath))).toBe(true);

    const markdown = readImplSkill();

    expect(markdown).toContain('name: reforge-impl');
    expect(markdown).toContain('allowed-tools: Read, Write, Edit, Bash, AskUserQuestion');
    expect(markdown).toContain('argument-hint: [entity]');
  });
});
