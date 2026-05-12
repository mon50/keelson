import { existsSync, readFileSync } from 'node:fs';
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

const reforgeDirectoryDocumentationPaths = [...validateSkillPaths, 'README.md'];

const reforgeStandardFiles = [
  {
    path: '.reforge/specs/<name>/spec.json',
    role: /プロダクト仕様|Single Source of Truth/
  },
  {
    path: '.reforge/specs/<name>/spec.previous.json',
    role: /直前のspecスナップショット|diff|差分/
  },
  {
    path: '.reforge/specs/<name>/questions.json',
    role: /質問キュー|pending|answered/
  },
  {
    path: '.reforge/specs/<name>/tasks.json',
    role: /実装タスクキュー|タスク|entity/
  }
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

function extractSecondLevelSection(markdown: string, heading: string): string {
  const start = markdown.indexOf(heading);
  if (start === -1) {
    return '';
  }

  const nextHeading = markdown.indexOf('\n## ', start + heading.length);
  return nextHeading === -1 ? markdown.slice(start) : markdown.slice(start, nextHeading);
}

function extractValidationStep(markdown: string, stepNumber: number): string {
  const validationFlow = extractSecondLevelSection(markdown, '## Validation Flow');
  const heading = `${stepNumber}. Step ${stepNumber}:`;
  const start = validationFlow.indexOf(heading);
  if (start === -1) {
    return '';
  }

  const nextHeading = validationFlow.indexOf(`\n${stepNumber + 1}. Step ${stepNumber + 1}:`, start + heading.length);
  return nextHeading === -1 ? validationFlow.slice(start) : validationFlow.slice(start, nextHeading);
}

function extractFrontmatter(markdown: string): Record<string, string> {
  const match = /^---\n([\s\S]*?)\n---/.exec(markdown);
  if (!match) {
    return {};
  }

  return Object.fromEntries(
    match[1]
      .split('\n')
      .map((line) => line.match(/^([^:]+):\s*(.*)$/))
      .filter((line): line is RegExpMatchArray => Boolean(line))
      .map((line) => [line[1], line[2]])
  );
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

  it('defines the complete installable skill list including plan and renderer', () => {
    expect(ALL_SKILLS).toEqual([
      'reforge-init',
      'reforge-resume',
      'reforge-answer',
      'reforge-update',
      'reforge-diff',
      'reforge-plan',
      'reforge-validate',
      'reforge-render',
      'reforge-impl',
      'reforge-verify'
    ]);
  });

  it('maps every installable skill to the command used in forwarder templates', () => {
    expect(SKILL_COMMAND).toEqual({
      'reforge-init': 'init',
      'reforge-resume': 'resume',
      'reforge-answer': 'answer',
      'reforge-update': 'update',
      'reforge-diff': 'diff',
      'reforge-plan': 'plan',
      'reforge-validate': 'validate',
      'reforge-render': 'render',
      'reforge-impl': 'impl [entity]',
      'reforge-verify': 'verify'
    });
    expect(Object.keys(SKILL_COMMAND).sort()).toEqual([...ALL_SKILLS].sort());
  });

  it('keeps packaged core skills in sync with checked-in agent skill copies', () => {
    for (const skill of ALL_SKILLS) {
      const core = readFileSync(resolve(process.cwd(), `skills/core/${skill}/SKILL.md`), 'utf8');
      const claude = readFileSync(
        resolve(process.cwd(), `.claude/skills/${skill}/SKILL.md`),
        'utf8'
      );
      const codex = readFileSync(
        resolve(process.cwd(), `.agents/skills/${skill}/SKILL.md`),
        'utf8'
      );

      expect(claude, `${skill} Claude skill must match package core`).toBe(core);
      expect(codex, `${skill} Codex skill must match package core`).toBe(core);
    }
  });
});

describe('spec.json shared contracts', () => {
  it('exports the TypeScript contract types for spec.json', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/types.ts'), 'utf8');
    const expectedExports = [
      'SpecJson',
      'SpecMeta',
      'SpecTech',
      'SpecContext',
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

  it('defines the validate skill frontmatter and explicit Step 1 through Step 7 skeleton', () => {
    const expectedSteps = [
      'Step 1: ファイル読み取り',
      'Step 2: スキーマ準拠検証',
      'Step 3: techセクション検証',
      'Step 4: meta.approved検証',
      'Step 5: 参照整合性検証',
      'Step 6: questions.json検証',
      'Step 7: 結果報告'
    ];

    for (const skillPath of validateSkillPaths) {
      const markdown = readFileSync(resolve(process.cwd(), skillPath), 'utf8');
      const frontmatter = extractFrontmatter(markdown);
      const validationFlow = extractSecondLevelSection(markdown, '## Validation Flow');

      expect(frontmatter, `${skillPath} must define the validate skill frontmatter`).toMatchObject({
        name: 'reforge-validate',
        'allowed-tools': 'Read, Glob'
      });
      expect(frontmatter.description, `${skillPath} must describe the validate command`).toMatch(
        /\/reforge-validate|spec\.json/
      );

      let previousStepPosition = -1;
      for (const step of expectedSteps) {
        const stepPosition = validationFlow.indexOf(step);
        expect(stepPosition, `${skillPath} must document ${step}`).toBeGreaterThan(previousStepPosition);
        previousStepPosition = stepPosition;
      }
    }
  });

  it('documents Step 2 schema compliance checks and missing-section error collection', () => {
    const requiredSections = ['meta', 'tech', 'entities', 'views', 'flows'];

    for (const skillPath of validateSkillPaths) {
      const markdown = readFileSync(resolve(process.cwd(), skillPath), 'utf8');
      const step2 = extractValidationStep(markdown, 2);

      expect(step2, `${skillPath} must document Step 2`).not.toBe('');

      for (const section of requiredSections) {
        expect(step2, `${skillPath} Step 2 must require ${section}`).toContain(`\`${section}\``);
      }

      expect(step2, `${skillPath} Step 2 must accumulate missing sections in errors`).toContain('`errors`');
      expect(step2, `${skillPath} Step 2 must continue after missing sections`).toMatch(/継続|停止しない|止まらない/);
      expect(step2, `${skillPath} Step 2 must define SCHEMA_MISSING_SECTION`).toContain(
        '`SCHEMA_MISSING_SECTION`'
      );
      expect(step2, `${skillPath} Step 2 must define the English missing-section message format`).toContain(
        "top-level section '<SectionName>' is required"
      );
      expect(step2, `${skillPath} Step 2 must define the Japanese missing-section message format`).toContain(
        "トップレベルセクション '<SectionName>' は必須です"
      );
      expect(step2, `${skillPath} Step 2 must mention the complete-section spec path check`).toContain(
        '`.reforge/specs/<name>/spec.json`'
      );
      expect(step2, `${skillPath} Step 2 must describe the passing complete-section sample/check`).toMatch(
        /すべて.*存在.*(?:通過|追加しない|エラーなし)/s
      );
    }
  });

  it('documents Step 3 tech section completeness checks and field-level errors', () => {
    const requiredTechFields = ['frontend', 'backend', 'database', 'orm', 'styling', 'testing'];

    for (const skillPath of validateSkillPaths) {
      const markdown = readFileSync(resolve(process.cwd(), skillPath), 'utf8');
      const step3 = extractValidationStep(markdown, 3);

      expect(step3, `${skillPath} must document Step 3`).not.toBe('');
      expect(step3, `${skillPath} Step 3 must mention the tech section`).toContain('`tech`');

      for (const field of requiredTechFields) {
        expect(step3, `${skillPath} Step 3 must require tech.${field}`).toContain(`\`${field}\``);
        expect(step3, `${skillPath} Step 3 must identify missing tech.${field}`).toContain(`tech.${field}`);
      }

      expect(step3, `${skillPath} Step 3 must accumulate missing tech fields in errors`).toContain('`errors`');
      expect(step3, `${skillPath} Step 3 must continue after missing tech fields`).toMatch(
        /継続|停止しない|止まらない/
      );
      expect(step3, `${skillPath} Step 3 must define TECH_MISSING_FIELD`).toContain('`TECH_MISSING_FIELD`');
      expect(step3, `${skillPath} Step 3 must define the English missing-tech-field message format`).toContain(
        'tech.<FieldName> is required'
      );
      expect(step3, `${skillPath} Step 3 must define the Japanese missing-tech-field message format`).toContain(
        'tech.<FieldName> は必須です'
      );
      expect(step3, `${skillPath} Step 3 must describe absent tech-section behavior`).toMatch(
        /`tech` セクションが欠如|techセクションが欠如/
      );
      expect(step3, `${skillPath} Step 3 must describe an observable missing-tech-section error`).toMatch(
        /トップレベルセクション 'tech' は必須です|top-level section 'tech' is required/
      );
    }
  });

  it('documents Step 4 meta.approved info reporting and plan/impl error gate', () => {
    for (const skillPath of validateSkillPaths) {
      const markdown = readFileSync(resolve(process.cwd(), skillPath), 'utf8');
      const step4 = extractValidationStep(markdown, 4);

      expect(step4, `${skillPath} must document Step 4`).not.toBe('');
      expect(step4, `${skillPath} Step 4 must read the meta.approved value`).toMatch(
        /`meta\.approved` の値を読み取/
      );
      expect(step4, `${skillPath} Step 4 must add false approval to an info list`).toMatch(
        /`meta\.approved` が `false` の場合.*`NOT_APPROVED`.*`info`.*リスト/s
      );
      expect(step4, `${skillPath} Step 4 must not classify NOT_APPROVED as an error`).toMatch(
        /`NOT_APPROVED` は `error` ではなく `info`/
      );
      expect(step4, `${skillPath} Step 4 must tell the user to approve with render`).toContain('/reforge-render');
      expect(step4, `${skillPath} Step 4 must define the plan/impl precondition error gate`).toMatch(
        /plan\/impl 実行要求時.*`meta\.approved` が `false` の場合.*エラー/s
      );
      expect(step4, `${skillPath} Step 4 must define an observable false-spec report`).toMatch(
        /`meta\.approved: false` のスペック.*`NOT_APPROVED`.*報告/s
      );
      expect(markdown, `${skillPath} must define NOT_APPROVED in the message catalog`).toContain(
        '`NOT_APPROVED`'
      );
      expect(markdown, `${skillPath} must include the approval message text`).toContain(
        '`meta.approved が false です。/reforge-render でUIプロトタイプを確認・承認してください`'
      );
    }
  });

  it('documents Step 5 reference integrity checks for views and flows', () => {
    for (const skillPath of validateSkillPaths) {
      const markdown = readFileSync(resolve(process.cwd(), skillPath), 'utf8');
      const step5 = extractValidationStep(markdown, 5);

      expect(step5, `${skillPath} must document Step 5`).not.toBe('');
      expect(step5, `${skillPath} Step 5 must build the entity key set from entities`).toMatch(
        /`entities`.*(?:キー|key).*集合/s
      );
      expect(step5, `${skillPath} Step 5 must inspect every view entry entity field`).toMatch(
        /`views`.*(?:各|すべて).*エントリ.*`entity`/s
      );
      expect(step5, `${skillPath} Step 5 must require view entity references to exist in entities`).toMatch(
        /`views\.<ViewName>\.entity`.*`entities`.*存在/s
      );
      expect(step5, `${skillPath} Step 5 must accumulate invalid view references in errors`).toMatch(
        /`REF_INTEGRITY_VIEW`.*`errors`|`errors`.*`REF_INTEGRITY_VIEW`/s
      );
      expect(step5, `${skillPath} Step 5 must inspect flow entity references`).toMatch(
        /`flows`.*entity.*参照.*`entities`.*存在/s
      );
      expect(step5, `${skillPath} Step 5 must accumulate invalid flow references in errors`).toMatch(
        /`REF_INTEGRITY_FLOW`.*`errors`|`errors`.*`REF_INTEGRITY_FLOW`/s
      );
      expect(step5, `${skillPath} Step 5 must keep collecting after each invalid reference`).toMatch(
        /(?:停止せず|継続|全件).*`errors`/s
      );
      expect(step5, `${skillPath} Step 5 must describe observable invalid-reference errors`).toMatch(
        /無効なentity参照.*`REF_INTEGRITY_VIEW`.*`REF_INTEGRITY_FLOW`/s
      );
    }
  });

  it('documents Step 6 pending questions warnings and Step 7 final reporting', () => {
    for (const skillPath of validateSkillPaths) {
      const markdown = readFileSync(resolve(process.cwd(), skillPath), 'utf8');
      const step6 = extractValidationStep(markdown, 6);
      const step7 = extractValidationStep(markdown, 7);

      expect(step6, `${skillPath} must document Step 6`).not.toBe('');
      expect(step6, `${skillPath} Step 6 must read questions.json`).toContain(
        '`.reforge/specs/<name>/questions.json`'
      );
      expect(step6, `${skillPath} Step 6 must count pending questions`).toMatch(/`pending`.*(?:件数|count)/s);
      expect(step6, `${skillPath} Step 6 must add pending questions to warnings`).toMatch(
        /`pending`.*1 件以上.*`warnings`/s
      );
      expect(step6, `${skillPath} Step 6 must define PENDING_QUESTIONS`).toContain('`PENDING_QUESTIONS`');
      expect(step6, `${skillPath} Step 6 must define the English pending message`).toContain(
        '<N> unresolved question(s) remain in questions.json pending queue'
      );
      expect(step6, `${skillPath} Step 6 must define the Japanese pending message`).toContain(
        'questions.json の pending キューに未解決の質問が <N> 件残っています'
      );

      expect(step7, `${skillPath} must document Step 7`).not.toBe('');
      expect(step7, `${skillPath} Step 7 must collect all result lists`).toMatch(
        /`errors`.*`warnings`.*`infos`/s
      );
      expect(step7, `${skillPath} Step 7 must output valid when there are no errors`).toMatch(
        /`errors` が 0 件.*`✔ valid`/s
      );
      expect(step7, `${skillPath} Step 7 must output invalid when errors exist`).toMatch(
        /`errors` が 1 件以上.*`✖ invalid`/s
      );
      expect(step7, `${skillPath} Step 7 must output warnings`).toContain('`⚠ warning: ...`');
      expect(step7, `${skillPath} Step 7 must output NOT_APPROVED infos`).toContain(
        '`ℹ info: [NOT_APPROVED] ...`'
      );
      expect(step6, `${skillPath} Step 6 must describe a valid no-pending sample`).toMatch(
        /`pending`.*0 件.*`✔ valid`/s
      );
    }
  });

  it('documents the complete .reforge directory contract and immutable path rule', () => {
    for (const documentationPath of reforgeDirectoryDocumentationPaths) {
      const absolutePath = resolve(process.cwd(), documentationPath);

      expect(existsSync(absolutePath), `${documentationPath} must exist`).toBe(true);

      const markdown = readFileSync(absolutePath, 'utf8');
      const relevantSection = validateSkillPaths.includes(documentationPath)
        ? extractSecondLevelSection(markdown, '## Prerequisites')
        : markdown;

      if (validateSkillPaths.includes(documentationPath)) {
        expect(relevantSection, `${documentationPath} must include a Prerequisites section`).not.toBe('');
      }

      expect(relevantSection).toContain('`.reforge/`');
      expect(relevantSection).toMatch(
        /`\.reforge\/` 配下のパスは変更してはならない|Do not rename or move the `\.reforge\/` paths/
      );

      for (const standardFile of reforgeStandardFiles) {
        expect(relevantSection, `${documentationPath} must document ${standardFile.path}`).toContain(
          `\`${standardFile.path}\``
        );
        expect(relevantSection, `${documentationPath} must explain the role of ${standardFile.path}`).toMatch(
          standardFile.role
        );
      }
    }
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
      expect(markdown).toContain('`meta.approved: false` の間は `/reforge-plan` と `/reforge-impl` を実行してはならない');
      expect(markdown).toContain('`meta.approved: true` の場合に限り `/reforge-plan` と `/reforge-impl` を実行できる');
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

      expect(markdown).toContain('`.reforge/specs/<name>/questions.json`');
      expect(markdown).toContain('`.reforge/specs/<name>/tasks.json`');
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
