import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import type {
  FieldType,
  QuestionPhase,
  QuestionsJson,
  SpecJson,
  Subtask,
  TaskEntry,
  TasksJson,
  TaskStatus
} from '../src/types';

import {
  ALL_SKILLS,
  ENV_SKILL_DIR,
  SKILL_COMMAND,
  TARGET_ENVIRONMENTS
} from '../src/types';

const validateSkillPaths = [
  '.claude/skills/reforge-validate/SKILL.md',
  '.agents/skills/reforge-validate/SKILL.md'
];

function parseJsonCodeBlocks(markdown: string): unknown[] {
  return [...markdown.matchAll(/```json\s*\n([\s\S]*?)\n```/g)]
    .map((match) => match[1])
    .flatMap((block) => {
      try {
        return [JSON.parse(block) as unknown];
      } catch {
        return [];
      }
    });
}

function isCompleteSpecSample(value: unknown): value is SpecJson {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<Record<keyof SpecJson, unknown>>;
  return ['meta', 'tech', 'entities', 'views', 'flows'].every((section) =>
    Object.prototype.hasOwnProperty.call(candidate, section)
  );
}

function isCompleteQuestionsSample(value: unknown): value is QuestionsJson {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<Record<keyof QuestionsJson, unknown>>;
  return (
    Array.isArray(candidate.pending) &&
    Array.isArray(candidate.answered) &&
    candidate.pending.some((entry) => Boolean(entry) && typeof entry === 'object' && !('answer' in entry)) &&
    candidate.answered.some((entry) => Boolean(entry) && typeof entry === 'object' && 'answer' in entry)
  );
}

function isCompleteTasksSample(value: unknown): value is TasksJson {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<Record<keyof TasksJson, unknown>>;
  return Array.isArray(candidate.tasks) && candidate.tasks.length > 0;
}

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

describe('reforge-validate skill documentation contracts', () => {
  it('keeps the Claude Code and Codex validate skill documentation in sync', () => {
    const [claudeMarkdown, codexMarkdown] = validateSkillPaths.map((skillPath) =>
      readFileSync(resolve(process.cwd(), skillPath), 'utf8')
    );

    expect(codexMarkdown).toBe(claudeMarkdown);
  });

  it('documents the complete spec.json sample, field constraints, and approval gate', () => {
    for (const skillPath of validateSkillPaths) {
      const markdown = readFileSync(resolve(process.cwd(), skillPath), 'utf8');
      const samples = parseJsonCodeBlocks(markdown);
      const completeSpec = samples.find(isCompleteSpecSample);

      expect(completeSpec, `${skillPath} must include a parseable complete spec.json sample`).toBeTruthy();
      expect(completeSpec?.meta.approved).toBe(false);
      expect(Object.keys(completeSpec?.tech ?? {})).toEqual([
        'frontend',
        'backend',
        'database',
        'orm',
        'styling',
        'testing'
      ]);

      const fields = completeSpec?.entities.report.fields ?? {};
      expect(Object.values(fields).map((field) => field.type).sort()).toEqual([
        'boolean',
        'date',
        'enum',
        'number',
        'string',
        'text'
      ]);

      for (const fieldType of ['string', 'number', 'date', 'enum', 'text', 'boolean']) {
        expect(markdown).toMatch(new RegExp(`\\|\\s*\`${fieldType}\`\\s*\\|`));
      }

      expect(markdown).toContain('`meta.approved` のデフォルト値は `false`');
      expect(markdown).toContain('`meta.approved: false` の間は `/reforge:plan` と `/reforge:impl` を実行してはならない');
      expect(markdown).toContain('`meta.approved: true` の場合に限り `/reforge:plan` と `/reforge:impl` を実行できる');
    }
  });

  it('documents questions.json and tasks.json samples with shared value lists', () => {
    for (const skillPath of validateSkillPaths) {
      const markdown = readFileSync(resolve(process.cwd(), skillPath), 'utf8');
      const samples = parseJsonCodeBlocks(markdown);
      const questionsSample = samples.find(isCompleteQuestionsSample);
      const tasksSample = samples.find(isCompleteTasksSample);

      expect(questionsSample, `${skillPath} must include a parseable questions.json sample`).toBeTruthy();
      expect(questionsSample?.pending[0]).toMatchObject({
        id: 'define_tech_frontend',
        phase: 'tech',
        question: 'フロントエンドフレームワークは何を使いますか？',
        type: 'single_choice',
        resolves: ['tech.frontend']
      });
      expect(questionsSample?.answered[0]).toMatchObject({
        id: 'define_entity_name',
        phase: 'data',
        question: '管理する主なデータ（エンティティ）の名前は？',
        type: 'text',
        resolves: ['entities'],
        answer: 'report'
      });

      for (const phase of ['meta', 'tech', 'data', 'views', 'flows']) {
        expect(markdown).toMatch(new RegExp(`\\|\\s*\`${phase}\`\\s*\\|`));
      }

      expect(tasksSample, `${skillPath} must include a parseable tasks.json sample`).toBeTruthy();
      expect(tasksSample?.tasks[0]).toEqual({
        id: 'report',
        entity: 'report',
        status: 'pending',
        subtasks: ['db', 'api', 'ui', 'test']
      });

      for (const status of ['pending', 'in_progress', 'done']) {
        expect(markdown).toMatch(new RegExp(`\\|\\s*\`${status}\`\\s*\\|`));
      }

      for (const subtask of ['db', 'api', 'ui', 'test']) {
        expect(markdown).toMatch(new RegExp(`\\|\\s*\`${subtask}\`\\s*\\|`));
      }

      expect(markdown).toContain('`.reforge/questions.json`');
      expect(markdown).toContain('`.reforge/tasks.json`');
      expect(markdown).toContain('タスク粒度は entity 単位');
    }
  });
});

describe('questions.json shared contracts', () => {
  it('exports the TypeScript contract types for questions.json', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/types.ts'), 'utf8');
    const expectedExports = ['PendingQuestion', 'AnsweredQuestion', 'QuestionsJson'];

    expect(source).toMatch(/export\s+type\s+QuestionPhase\s*=/);

    for (const exportName of expectedExports) {
      expect(source).toMatch(new RegExp(`export\\s+(?:interface|type)\\s+${exportName}\\b`));
    }
  });

  it('accepts a complete questions.json sample with all supported phases', () => {
    const phases: QuestionPhase[] = ['meta', 'tech', 'data', 'views', 'flows'];
    const questions: QuestionsJson = {
      pending: [
        {
          id: 'define_tech_frontend',
          phase: 'tech',
          question: 'フロントエンドフレームワークは何を使いますか？',
          type: 'single_choice',
          resolves: ['tech.frontend']
        }
      ],
      answered: [
        {
          id: 'define_entity_name',
          phase: 'data',
          question: '管理する主なデータ（エンティティ）の名前は？',
          type: 'text',
          resolves: ['entities'],
          answer: 'report'
        }
      ]
    };

    expect(phases).toEqual(['meta', 'tech', 'data', 'views', 'flows']);
    expect(questions.pending[0].resolves).toEqual(['tech.frontend']);
    expect(questions.answered[0].answer).toBe('report');
  });
});

describe('tasks.json shared contracts', () => {
  it('exports the TypeScript contract types for tasks.json', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/types.ts'), 'utf8');
    const expectedExports = ['TaskEntry', 'TasksJson'];

    expect(source).toMatch(/export\s+type\s+TaskStatus\s*=/);
    expect(source).toMatch(/export\s+type\s+Subtask\s*=/);

    for (const exportName of expectedExports) {
      expect(source).toMatch(new RegExp(`export\\s+(?:interface|type)\\s+${exportName}\\b`));
    }
  });

  it('accepts a complete tasks.json sample with all supported statuses and subtasks', () => {
    const statuses: TaskStatus[] = ['pending', 'in_progress', 'done'];
    const subtasks: Subtask[] = ['db', 'api', 'ui', 'test'];
    const task: TaskEntry = {
      id: 'report',
      entity: 'report',
      status: 'pending',
      subtasks
    };
    const tasksJson: TasksJson = {
      tasks: [task]
    };

    expect(statuses).toEqual(['pending', 'in_progress', 'done']);
    expect(tasksJson.tasks[0]).toEqual({
      id: 'report',
      entity: 'report',
      status: 'pending',
      subtasks: ['db', 'api', 'ui', 'test']
    });
  });
});
