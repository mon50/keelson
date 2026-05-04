import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import type { FieldType, SpecJson } from '../src/types';

import {
  ALL_SKILLS,
  ENV_SKILL_DIR,
  SKILL_COMMAND,
  TARGET_ENVIRONMENTS
} from '../src/types';

describe('installer shared contracts', () => {
  it('defines all supported target environments and their skill directories', () => {
    expect(TARGET_ENVIRONMENTS).toEqual(['claude-code', 'codex']);
    expect(ENV_SKILL_DIR).toEqual({
      'claude-code': '.claude/skills',
      codex: '.agents/skills'
    });
    expect(Object.keys(ENV_SKILL_DIR).sort()).toEqual([...TARGET_ENVIRONMENTS].sort());
  });

  it('defines the complete installable skill list including renderer', () => {
    expect(ALL_SKILLS).toEqual([
      'reforge-init',
      'reforge-resume',
      'reforge-update',
      'reforge-diff',
      'reforge-validate',
      'reforge-render'
    ]);
  });

  it('maps every installable skill to the command used in forwarder templates', () => {
    expect(SKILL_COMMAND).toEqual({
      'reforge-init': 'init',
      'reforge-resume': 'resume',
      'reforge-update': 'update',
      'reforge-diff': 'diff',
      'reforge-validate': 'validate',
      'reforge-render': 'render'
    });
    expect(Object.keys(SKILL_COMMAND).sort()).toEqual([...ALL_SKILLS].sort());
  });
});

describe('spec.json shared contracts', () => {
  it('exports the TypeScript contract types for spec.json', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/types.ts'), 'utf8');
    const expectedExports = [
      'SpecJson',
      'SpecMeta',
      'SpecTech',
      'EntityDefinition',
      'FieldDefinition',
      'ViewDefinition',
      'FlowDefinition'
    ];

    expect(source).toMatch(/export\s+type\s+FieldType\s*=/);

    for (const exportName of expectedExports) {
      expect(source).toMatch(new RegExp(`export\\s+(?:interface|type)\\s+${exportName}\\b`));
    }
  });

  it('accepts a complete spec.json sample with every supported field type', () => {
    const fieldTypes: FieldType[] = ['string', 'number', 'date', 'enum', 'text', 'boolean'];
    const spec: SpecJson = {
      meta: {
        name: 'daily-report',
        version: '0.1.0',
        lang: 'ja',
        approved: false
      },
      tech: {
        frontend: 'Next.js',
        backend: 'Node.js / Express',
        database: 'PostgreSQL',
        orm: 'Prisma',
        styling: 'Tailwind CSS',
        testing: 'Vitest'
      },
      entities: {
        report: {
          fields: {
            title: { type: 'string', required: true },
            score: { type: 'number' },
            reportedAt: { type: 'date' },
            status: { type: 'enum', options: ['draft', 'submitted'] },
            body: { type: 'text' },
            published: { type: 'boolean' }
          }
        }
      },
      views: {
        reportList: {
          type: 'list',
          entity: 'report',
          fields: ['title', 'status', 'reportedAt']
        }
      },
      flows: {
        submitReport: {
          steps: ['Create report', 'Review report', 'Submit report']
        }
      }
    };

    expect(fieldTypes).toEqual(['string', 'number', 'date', 'enum', 'text', 'boolean']);
    expect(spec.meta.approved).toBe(false);
    expect(spec.entities.report.fields.status.options).toEqual(['draft', 'submitted']);
  });
});
