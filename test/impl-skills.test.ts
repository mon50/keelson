import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(__dirname, '..');
const markdown = fs.readFileSync(
  path.join(repoRoot, 'skills/core/keel-impl/SKILL.md'),
  'utf8'
);

describe('keel-impl skill', () => {
  it('declares the Kiro-style implementation command contract', () => {
    expect(markdown).toContain('name: keel-impl');
    expect(markdown).toContain('argument-hint: [task-id]');
    expect(markdown).toContain('Implement one task from `plan.md`');
    expect(markdown).toContain('Block unless `artifacts.plan.status` is `approved`.');
  });

  it('uses the approved artifact bundle as implementation source of truth', () => {
    for (const artifact of [
      'requirements.md',
      'user-stories.md',
      'us-mock.html',
      'design.md',
      'prototype.html',
      'plan.md',
      'manifest.json',
      'audit.md'
    ]) {
      expect(markdown).toContain(artifact);
    }

    expect(markdown).toContain('Do not ask new product questions during implementation.');
    expect(markdown).toContain('missing requirement: `/keel-requirements`');
    expect(markdown).toContain('missing user operation: `/keel-us`');
    expect(markdown).toContain('missing implementation detail: `/keel-design`');
    expect(markdown).toContain('prototype/design mismatch: `/keel-proto`');
  });

  it('documents the implementation loop and plan update gate', () => {
    for (const step of [
      'Restate the task',
      'Inspect the relevant existing code',
      'Add or update tests first',
      'Implement the smallest change',
      'Run the relevant tests or checks',
      'Update `plan.md` with task status and implementation notes',
      'Append an implementation entry to `audit.md`',
      'next pending task'
    ]) {
      expect(markdown).toContain(step);
    }
  });
});
