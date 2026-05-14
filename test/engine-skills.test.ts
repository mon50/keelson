import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(__dirname, '..');

function skill(name: string): string {
  return fs.readFileSync(path.join(repoRoot, 'skills/core', name, 'SKILL.md'), 'utf8');
}

function expectHeadings(markdown: string, headings: readonly string[]): void {
  for (const heading of headings) {
    expect(markdown).toContain(heading);
  }
}

describe('reforge-requirements skill', () => {
  it('creates requirements.md and manifest.json without the legacy question queue', () => {
    const markdown = skill('reforge-requirements');

    expect(markdown).toContain('name: reforge-requirements');
    expect(markdown).toContain('argument-hint: "\\"<idea>\\""');
    expect(markdown).toContain('requirements.md');
    expect(markdown).toContain('manifest.json');
    expect(markdown).toContain('Write open questions inside the artifact that owns them.');
    expect(markdown).toContain('/reforge-us');
    expectHeadings(markdown, [
      '# Requirements',
      '## Product Intent',
      '## Users',
      '## In Scope',
      '## Out of Scope',
      '## Acceptance Signals',
      '## Constraints',
      '## Open Questions',
      '## Next Gate'
    ]);
  });
});

describe('reforge-us skill', () => {
  it('turns approved requirements into user stories and US mock operations', () => {
    const markdown = skill('reforge-us');

    expect(markdown).toContain('Block if `artifacts.requirements.status` is not `approved`.');
    expect(markdown).toContain('user-stories.md');
    expect(markdown).toContain('us-mock.md');
    expect(markdown).toContain('Every story must have a stable id such as `US-001`');
    expect(markdown).toContain('prototype implication');
    expect(markdown).toContain('route back to `/reforge-requirements`');
    expect(markdown).toContain('/reforge-design');
    expectHeadings(markdown, [
      '# User Stories',
      '## Story Map',
      '## Stories',
      '## Acceptance Criteria',
      '## Requirement Traceability',
      '## Open Issues'
    ]);
  });
});

describe('reforge-design skill', () => {
  it('grounds implementation design in approved artifacts and existing code evidence', () => {
    const markdown = skill('reforge-design');

    expect(markdown).toContain(
      'Block unless `artifacts.requirements.status`, `artifacts.userStories.status`, and `artifacts.usMock.status` are `approved`.'
    );
    expect(markdown).toContain('existing implementation evidence');
    expect(markdown).toContain('Files To Touch');
    expect(markdown).toContain('Files Not To Touch');
    expect(markdown).toContain('route to `/reforge-requirements`');
    expect(markdown).toContain('route to `/reforge-us`');
    expect(markdown).toContain('/reforge-proto');
    expectHeadings(markdown, [
      '# Design',
      '## Source Artifacts',
      '## Existing Implementation Evidence',
      '## Architecture',
      '## Data Model',
      '## API / Server Behavior',
      '## UI Composition',
      '## Test Strategy',
      '## Prototype Guidance'
    ]);
  });
});

describe('reforge-proto skill', () => {
  it('creates the simplified prototype after design approval and routes mismatches upstream', () => {
    const markdown = skill('reforge-proto');

    expect(markdown).toContain('prototype.html');
    expect(markdown).toContain(
      'Block unless `artifacts.requirements.status`, `artifacts.userStories.status`, `artifacts.usMock.status`, and `artifacts.design.status` are `approved`.'
    );
    expect(markdown).toContain('demonstrate each user story');
    expect(markdown).toContain('mark `artifacts.usMock.status` as `needs_revision`');
    expect(markdown).toContain('mark `artifacts.design.status` as `needs_revision`');
    expect(markdown).toContain('/reforge-plan');
  });
});

describe('reforge-plan skill', () => {
  it('generates plan.md from the approved artifact bundle', () => {
    const markdown = skill('reforge-plan');

    expect(markdown).toContain('Create `plan.md`');
    expect(markdown).toContain(
      'Block unless `artifacts.requirements.status`, `artifacts.userStories.status`, `artifacts.usMock.status`, `artifacts.design.status`, and `artifacts.prototype.status` are `approved`.'
    );
    expect(markdown).toContain('stable id such as `T-001`');
    expect(markdown).toContain('No task may rely only on the prototype');
    expect(markdown).toContain('/reforge-impl');
    expectHeadings(markdown, [
      '# Implementation Plan',
      '## Source Artifacts',
      '## Task List',
      '## Task Details',
      '## Test Plan',
      '## Review Gates',
      '## Out Of Scope'
    ]);
  });
});
