import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  ALL_SKILLS,
  SKILL_COMMAND,
  type ArtifactRecord,
  type KeelsonManifest,
  type QuickManifest,
  type TaskEntry,
  type TasksJson
} from '../src/types';

const repoRoot = path.resolve(__dirname, '..');

const expectedSkills = [
  'keel-requirements',
  'keel-us',
  'keel-design',
  'keel-proto',
  'keel-plan',
  'keel-impl',
  'keel-status',
  'keel-steering',
  'keel-verify',
  'keel-quick'
] as const;

function read(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('public command contract', () => {
  it('exports only the new artifact-first workflow skills', () => {
    expect(ALL_SKILLS).toEqual(expectedSkills);
    expect(SKILL_COMMAND).toEqual({
      'keel-requirements': 'requirements "<idea>"',
      'keel-us': 'us',
      'keel-design': 'design',
      'keel-proto': 'proto',
      'keel-plan': 'plan',
      'keel-impl': 'impl [task-id]',
      'keel-status': 'status',
      'keel-steering': 'steering',
      'keel-verify': 'verify',
      'keel-quick': 'quick "<change>"'
    });
  });
});

describe('artifact manifest contract', () => {
  it('accepts the new manifest shape as an index, not as the SSoT', () => {
    const artifact = (
      pathName: string,
      phase: ArtifactRecord['phase'],
      status: ArtifactRecord['status']
    ): ArtifactRecord => ({
      path: pathName,
      phase,
      status,
      digest: `sha256:${pathName}`,
      approvedAt: '2026-05-14T00:00:00Z'
    });

    const manifest: KeelsonManifest = {
      version: 1,
      feature: 'daily-report',
      currentPhase: 'implementation',
      artifacts: {
        requirements: artifact('requirements.md', 'requirements', 'approved'),
        userStories: artifact('user-stories.md', 'user-stories', 'approved'),
        usMock: artifact('us-mock.html', 'user-stories', 'approved'),
        design: artifact('design.md', 'design', 'approved'),
        prototype: artifact('prototype.html', 'prototype', 'approved'),
        plan: artifact('plan.md', 'plan', 'approved')
      }
    };

    expect(manifest.artifacts.prototype.path).toBe('prototype.html');
    expect(manifest.artifacts.design.status).toBe('approved');
  });

  it('accepts the lightweight quick-track manifest shape', () => {
    const manifest: QuickManifest = {
      version: 1,
      feature: 'fix-pagination',
      track: 'quick',
      currentPhase: 'change',
      change: { path: 'change.md', phase: 'change', status: 'approved' }
    };

    expect(manifest.track).toBe('quick');
    expect(manifest.change.path).toBe('change.md');
  });

  it('keeps implementation tasks traceable to approved artifacts', () => {
    const task: TaskEntry = {
      id: 'T-001',
      title: 'Create report entry screen',
      status: 'pending',
      source: 'user-story',
      dependsOn: [],
      acceptance: ['US-001 happy path is implemented'],
      files: ['src/app/reports/page.tsx']
    };
    const tasks: TasksJson = { tasks: [task] };

    expect(tasks.tasks[0].source).toBe('user-story');
    expect(tasks.tasks[0].acceptance).toContain('US-001 happy path is implemented');
  });
});

describe('skill copy contract', () => {
  it('keeps core, Claude Code, and Codex skill bodies in sync', () => {
    for (const skill of expectedSkills) {
      const core = read(`skills/core/${skill}/SKILL.md`);
      expect(read(`.claude/skills/${skill}/SKILL.md`), `.claude ${skill}`).toBe(core);
      expect(read(`.agents/skills/${skill}/SKILL.md`), `.agents ${skill}`).toBe(core);
    }
  });

  it('documents the new source-of-truth artifacts in user-facing docs', () => {
    const docs = [
      read('README.md'),
      read('README_ja.md'),
      read('AGENTS.md'),
      read('CLAUDE.md'),
      read('docs/guides/workflow-guide.md')
    ].join('\n');

    for (const file of [
      'requirements.md',
      'user-stories.md',
      'us-mock.html',
      'design.md',
      'prototype.html',
      'plan.md',
      'audit.md'
    ]) {
      expect(docs).toContain(file);
    }

    expect(docs).toContain('Resume Point');
  });
});
