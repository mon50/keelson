import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('implementation workflow cleanup', () => {
  it('removes the standalone verify skill from core, Claude Code, and Codex installs', () => {
    expect(fs.existsSync(path.join(repoRoot, 'skills/core/keelson-verify'))).toBe(false);
    expect(fs.existsSync(path.join(repoRoot, '.claude/skills/keelson-verify/SKILL.md'))).toBe(false);
    expect(fs.existsSync(path.join(repoRoot, '.agents/skills/keelson-verify/SKILL.md'))).toBe(false);
  });

  it('keeps verification inside the task implementation loop', () => {
    const impl = read('skills/core/keel-impl/SKILL.md');

    expect(impl).toContain('Run the relevant tests or checks.');
    expect(impl).toContain('Report files changed, checks run, and any remaining manual verification.');
    expect(impl).toContain('Tests/checks cover the task');
  });
});
