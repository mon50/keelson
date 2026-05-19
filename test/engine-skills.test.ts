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

describe('keel-requirements skill', () => {
  it('creates requirements.md, manifest.json, and audit.md', () => {
    const markdown = skill('keel-requirements');

    expect(markdown).toContain('name: keel-requirements');
    expect(markdown).toContain('argument-hint: "\\"<idea>\\""');
    expect(markdown).toContain('requirements.md');
    expect(markdown).toContain('manifest.json');
    expect(markdown).toContain('audit.md');
    expect(markdown).toContain('Write open questions inside the artifact that owns them.');
    expect(markdown).toContain('.keelson/steering');
    expect(markdown).toContain('/keel-us');
    expectHeadings(markdown, [
      '# Requirements',
      '## Product Intent',
      '## Users',
      '## In Scope',
      '## Out of Scope',
      '## Acceptance Signals',
      '## UI Design Expectations',
      '## Constraints',
      '## Open Questions',
      '## Next Gate'
    ]);
    expect(markdown).toContain('Do not leave UI design expectations implicit');
    expect(markdown).toContain('Never guess an unknown');
    expect(markdown).toContain('# Audit Trail');
    expect(markdown).toContain('## Resume Point');
  });
});

describe('keel-us skill', () => {
  it('turns approved requirements into user stories and US mock operations', () => {
    const markdown = skill('keel-us');

    expect(markdown).toContain('Block if `artifacts.requirements.status` is not `approved`.');
    expect(markdown).toContain('.keelson/steering');
    expect(markdown).toContain('user-stories.md');
    expect(markdown).toContain('us-mock.html');
    expect(markdown).toContain('Every story must have a stable id such as `US-001`');
    expect(markdown).toContain('browser-readable scenario mock');
    expect(markdown).toContain('Use `<details>` and `<summary>`');
    expect(markdown).toContain('Inline CSS only');
    expect(markdown).toContain('UI design expectations inherited from `requirements.md`');
    expect(markdown).toContain('prototype implication');
    expect(markdown).toContain('Never guess to cover a gap');
    expect(markdown).toContain('### Review Controls');
    expect(markdown).toContain('Copy review feedback');
    expect(markdown).toContain('route back to `/keel-requirements`');
    expect(markdown).toContain('updated `audit.md`');
    expect(markdown).toContain('Resume Point');
    expect(markdown).toContain('/keel-design');
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

describe('keel-design skill', () => {
  it('grounds implementation design in approved artifacts and existing code evidence', () => {
    const markdown = skill('keel-design');

    expect(markdown).toContain(
      'Block unless `artifacts.requirements.status`, `artifacts.userStories.status`, and `artifacts.usMock.status` are `approved`.'
    );
    expect(markdown).toContain('existing implementation evidence');
    expect(markdown).toContain('.keelson/steering');
    expect(markdown).toContain('Files To Touch');
    expect(markdown).toContain('Files Not To Touch');
    expect(markdown).toContain('route to `/keel-requirements`');
    expect(markdown).toContain('route to `/keel-us`');
    expect(markdown).toContain('audit.md');
    expect(markdown).toContain('Resume Point');
    expect(markdown).toContain('/keel-proto');
    expectHeadings(markdown, [
      '# Design',
      '## Source Artifacts',
      '## Existing Implementation Evidence',
      '## Architecture',
      '## Data Model',
      '## API / Server Behavior',
      '## UI Composition',
      '## Visual Design Direction',
      '## Test Strategy',
      '## Prototype Guidance'
    ]);
    expect(markdown).toContain('requirements.md` UI design expectations');
    expect(markdown).toContain('Never guess the existing stack');
  });
});

describe('keel-proto skill', () => {
  it('creates the simplified prototype after design approval and routes mismatches upstream', () => {
    const markdown = skill('keel-proto');

    expect(markdown).toContain('prototype.html');
    expect(markdown).toContain(
      'Block unless `artifacts.requirements.status`, `artifacts.userStories.status`, `artifacts.usMock.status`, and `artifacts.design.status` are `approved`.'
    );
    expect(markdown).toContain('demonstrate each user story');
    expect(markdown).toContain('.keelson/steering');
    expect(markdown).toContain('mark `artifacts.usMock.status` as `needs_revision`');
    expect(markdown).toContain('mark `artifacts.design.status` as `needs_revision`');
    expect(markdown).toContain('updated `audit.md`');
    expect(markdown).toContain('### Layout');
    expect(markdown).toContain('Panorama (horizontal)');
    expect(markdown).toContain('Resume Point');
    expect(markdown).toContain('/keel-plan');
    expect(markdown).toContain('Never invent UI, copy, or flows');
  });
});

describe('keel-status skill', () => {
  it('navigates by reading manifest.json and audit.md without editing artifacts', () => {
    const markdown = skill('keel-status');

    expect(markdown).toContain('name: keel-status');
    expect(markdown).toContain('allowed-tools: Read, Glob, AskUserQuestion');
    expect(markdown).toContain('read-only navigator');
    expect(markdown).toContain('manifest.json');
    expect(markdown).toContain('audit.md');
    expect(markdown).toContain('## Resume Point');
    expect(markdown).toContain('Never write or edit');
    expectHeadings(markdown, [
      '# keel-status',
      '## Purpose',
      '## Inputs',
      '## Status Report Contract',
      '## Next Command Logic',
      '## Quality Gate'
    ]);
  });
});

describe('keel-steering skill', () => {
  it('captures project-wide steering as product, tech, and principles', () => {
    const markdown = skill('keel-steering');

    expect(markdown).toContain('name: keel-steering');
    expect(markdown).toContain('.keelson/steering/product.md');
    expect(markdown).toContain('.keelson/steering/tech.md');
    expect(markdown).toContain('.keelson/steering/principles.md');
    expect(markdown).toContain('project-wide');
    expect(markdown).toContain('not an approval gate');
    expectHeadings(markdown, [
      '# keel-steering',
      '## Purpose',
      '## Steering Contract',
      '## Quality Gate'
    ]);
  });
});

describe('keel-verify skill', () => {
  it('audits the implementation against the approved artifact bundle', () => {
    const markdown = skill('keel-verify');

    expect(markdown).toContain('name: keel-verify');
    expect(markdown).toContain('Block unless `artifacts.plan.status` is `approved`');
    expect(markdown).toContain('verify-report.md');
    expect(markdown).toContain('Traceability');
    expect(markdown).toContain('Cross-artifact consistency');
    expect(markdown).toContain('Guarantee Boundaries');
    expect(markdown).toContain('Never edit implementation code');
    expectHeadings(markdown, [
      '# keel-verify',
      '## Purpose',
      '## What keel-verify checks',
      '## Verify-Report Contract',
      '## Routing',
      '## Quality Gate'
    ]);
  });
});

describe('keel-plan skill', () => {
  it('generates plan.md from the approved artifact bundle', () => {
    const markdown = skill('keel-plan');

    expect(markdown).toContain('Create `plan.md`');
    expect(markdown).toContain('.keelson/steering');
    expect(markdown).toContain(
      'Block unless `artifacts.requirements.status`, `artifacts.userStories.status`, `artifacts.usMock.status`, `artifacts.design.status`, and `artifacts.prototype.status` are `approved`.'
    );
    expect(markdown).toContain('stable id such as `T-001`');
    expect(markdown).toContain('No task may rely only on the prototype');
    expect(markdown).toContain('Never invent tasks, files');
    expect(markdown).toContain('audit.md');
    expect(markdown).toContain('Resume Point');
    expect(markdown).toContain('/keel-impl');
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
