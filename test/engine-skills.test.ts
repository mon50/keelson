import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import type { QuestionsJson, SpecJson, TasksJson } from '../src/types';

import { ALL_SKILLS, SKILL_COMMAND } from '../src/types';

const initSkillPaths = [
  '.claude/skills/reforge-init/SKILL.md',
  '.agents/skills/reforge-init/SKILL.md'
];

const resumeSkillPaths = [
  '.claude/skills/reforge-resume/SKILL.md',
  '.agents/skills/reforge-resume/SKILL.md'
];

const updateSkillPaths = [
  '.claude/skills/reforge-update/SKILL.md',
  '.agents/skills/reforge-update/SKILL.md'
];

const diffSkillPaths = [
  '.claude/skills/reforge-diff/SKILL.md',
  '.agents/skills/reforge-diff/SKILL.md'
];

const planSkillPaths = [
  '.claude/skills/reforge-plan/SKILL.md',
  '.agents/skills/reforge-plan/SKILL.md'
];

const answerSkillPaths = [
  '.claude/skills/reforge-answer/SKILL.md',
  '.agents/skills/reforge-answer/SKILL.md'
];

const questionProtocolSkillPaths = [...initSkillPaths, ...resumeSkillPaths, ...updateSkillPaths];

const audienceStyleSkillPaths = [
  ...initSkillPaths,
  ...resumeSkillPaths,
  ...answerSkillPaths,
  ...updateSkillPaths
];

const requiredTechFields = ['frontend', 'backend', 'database', 'orm', 'styling', 'testing'] as const;
const requiredInceptionQuestionIds = ['define_audience', 'define_intent', 'define_requirements'] as const;
const requiredInceptionPhases = ['audience', 'intent', 'requirements'] as const;

function readMarkdown(skillPath: string): string {
  return readFileSync(resolve(process.cwd(), skillPath), 'utf8');
}

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

function isSpecJson(value: unknown): value is SpecJson {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<Record<keyof SpecJson, unknown>>;
  const meta = candidate.meta as Partial<SpecJson['meta']> | undefined;
  const tech = candidate.tech as Partial<SpecJson['tech']> | undefined;

  return (
    Boolean(meta) &&
    typeof meta?.name === 'string' &&
    meta.version === '0.1.0' &&
    typeof meta.lang === 'string' &&
    meta.approved === false &&
    Boolean(tech) &&
    requiredTechFields.every((field) => typeof tech?.[field] === 'string') &&
    Boolean(candidate.entities) &&
    typeof candidate.entities === 'object' &&
    Boolean(candidate.views) &&
    typeof candidate.views === 'object' &&
    Boolean(candidate.flows) &&
    typeof candidate.flows === 'object'
  );
}

function isQuestionsJson(value: unknown): value is QuestionsJson {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<QuestionsJson>;
  return Array.isArray(candidate.pending) && Array.isArray(candidate.answered);
}

function isInceptionQuestionsSample(value: unknown): value is QuestionsJson {
  if (!isQuestionsJson(value)) {
    return false;
  }

  const questionIds = value.pending.map((question) => question.id);
  return requiredInceptionQuestionIds.every((id) => questionIds.includes(id));
}

function isTasksJson(value: unknown): value is TasksJson {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<TasksJson>;
  return Array.isArray(candidate.tasks);
}

describe('reforge-init engine skill contracts', () => {
  it('keeps Claude Code and Codex init skill documentation in sync', () => {
    const [claudeMarkdown, codexMarkdown] = initSkillPaths.map(readMarkdown);

    expect(codexMarkdown).toBe(claudeMarkdown);
  });

  it('documents generation of a SpecJson-compliant draft from a natural language description', () => {
    for (const skillPath of initSkillPaths) {
      const markdown = readMarkdown(skillPath);
      const samples = parseJsonCodeBlocks(markdown);
      const generatedSpec = samples.find(isSpecJson);

      expect(markdown, `${skillPath} must describe natural-language draft generation`).toMatch(
        /自然言語.*SpecJson|自然言語.*spec\.json/
      );
      expect(generatedSpec, `${skillPath} must include a parseable SpecJson draft sample`).toBeTruthy();
      expect(generatedSpec?.meta).toMatchObject({
        version: '0.1.0',
        approved: false
      });
      expect(Object.keys(generatedSpec?.tech ?? {})).toEqual([...requiredTechFields]);
    }
  });

  it('documents pending Inception questions (audience / intent / requirements) and defers tech questions', () => {
    for (const skillPath of initSkillPaths) {
      const markdown = readMarkdown(skillPath);
      const samples = parseJsonCodeBlocks(markdown);
      const questionsSample = samples.find(isInceptionQuestionsSample);

      expect(questionsSample, `${skillPath} must include an Inception questions.json sample`).toBeTruthy();
      expect(questionsSample?.answered).toEqual([]);

      for (const id of requiredInceptionQuestionIds) {
        expect(markdown, `${skillPath} must document ${id}`).toContain(id);
      }

      const pendingQuestionIds = questionsSample?.pending.map((question) => question.id) ?? [];
      expect(pendingQuestionIds).toEqual([...requiredInceptionQuestionIds]);

      for (const question of questionsSample?.pending ?? []) {
        expect(requiredInceptionPhases as readonly string[]).toContain(question.phase);
        expect(question.resolves.length).toBeGreaterThan(0);
      }

      expect(markdown, `${skillPath} must still describe the 6 tech subfields for later question generation`).toContain(
        'tech.{field}'
      );
      for (const field of requiredTechFields) {
        expect(markdown, `${skillPath} must reference define_tech_${field} in deferred generation rules`).toContain(
          `define_tech_${field}`
        );
      }

      expect(markdown, `${skillPath} must defer tech questions until requirements are non-empty`).toMatch(
        /初期化時に tech 質問を即 pending 化することは禁止|requirements.*non-empty|requirements 確定後/
      );
    }
  });
});

describe('reforge-resume engine skill contracts', () => {
  it('keeps Claude Code and Codex resume skill documentation in sync', () => {
    const [claudeMarkdown, codexMarkdown] = resumeSkillPaths.map(readMarkdown);

    expect(codexMarkdown).toBe(claudeMarkdown);
  });

  it('documents navigator decisions in the required stop-at-first-match order', () => {
    const expectedOrder = [
      '`SPEC_PATH` missing',
      '`QUESTIONS_PATH` pending',
      'reforge-validate fails',
      '`meta.approved` is `false`',
      '`TASKS_PATH` missing',
      '`pending` or `in_progress` task exists',
      'verification is not complete',
      'project complete'
    ];

    for (const skillPath of resumeSkillPaths) {
      const markdown = readMarkdown(skillPath);
      let previousPosition = -1;

      expect(markdown, `${skillPath} must define the navigator as stop-at-first-match`).toMatch(
        /stop at the first matching condition|最初に一致した条件で停止/
      );

      for (const marker of expectedOrder) {
        const position = markdown.indexOf(marker);
        expect(position, `${skillPath} must document navigator marker: ${marker}`).toBeGreaterThan(
          previousPosition
        );
        previousPosition = position;
      }
    }
  });

  it('documents the observable guidance for init, question, render, and plan branches', () => {
    for (const skillPath of resumeSkillPaths) {
      const markdown = readMarkdown(skillPath);

      expect(markdown, `${skillPath} must guide init when spec.json is missing`).toMatch(
        /`SPEC_PATH` missing[\s\S]*\/reforge-init/
      );
      expect(markdown, `${skillPath} must present a batch of up to 4 pending questions`).toMatch(
        /`QUESTIONS_PATH` pending[\s\S]*AskUserQuestion[\s\S]*(?:最大\s*4\s*[問件]|up to 4)|`QUESTIONS_PATH` pending[\s\S]*(?:バッチ|batch)/
      );
      expect(markdown, `${skillPath} must guide render when meta.approved is false`).toMatch(
        /`meta\.approved` is `false`[\s\S]*\/reforge-render/
      );
      expect(markdown, `${skillPath} must guide plan when tasks.json is missing`).toMatch(
        /`TASKS_PATH` missing[\s\S]*\/reforge-plan/
      );
      expect(markdown, `${skillPath} must not contain the deprecated /reforge:xxx command format`).not.toMatch(
        /\/reforge:(init|resume|answer|update|render|plan|impl|verify|validate|diff)/
      );
      expect(markdown, `${skillPath} must use the canonical lifecycle vocab (no bare 'Lifecycle: question')`).not.toMatch(
        /Lifecycle:\s*question\b(?!s_)/
      );
    }
  });
});

describe('reforge-update and reforge-diff engine skill contracts', () => {
  it('keeps Claude Code and Codex update and diff skill documentation in sync', () => {
    const [claudeUpdateMarkdown, codexUpdateMarkdown] = updateSkillPaths.map(readMarkdown);
    const [claudeDiffMarkdown, codexDiffMarkdown] = diffSkillPaths.map(readMarkdown);

    expect(codexUpdateMarkdown).toBe(claudeUpdateMarkdown);
    expect(codexDiffMarkdown).toBe(claudeDiffMarkdown);
  });

  it('documents minimal update diffs with a saved previous snapshot and unrelated fields preserved', () => {
    for (const skillPath of updateSkillPaths) {
      const markdown = readMarkdown(skillPath);
      const specSamples = parseJsonCodeBlocks(markdown).filter(isSpecJson);
      const previousSpec = specSamples.find((spec) =>
        spec.entities.report?.fields.status?.options?.includes('draft')
      );
      const updatedSpec = specSamples.find((spec) =>
        spec.entities.report?.fields.status?.options?.includes('archived')
      );

      expect(markdown, `${skillPath} must save the snapshot before writing spec.json`).toMatch(
        /spec\.previous\.json[\s\S]*(?:before writing|書き込む前|更新前)/
      );
      expect(markdown, `${skillPath} must name the changed JSON path`).toContain(
        'entities.report.fields.status.options'
      );
      expect(previousSpec, `${skillPath} must include the previous spec sample`).toBeTruthy();
      expect(updatedSpec, `${skillPath} must include the updated spec sample`).toBeTruthy();
      expect(updatedSpec?.meta, `${skillPath} must preserve unrelated meta fields`).toEqual(previousSpec?.meta);
      expect(
        updatedSpec?.entities.report?.fields.title,
        `${skillPath} must preserve unrelated entity fields`
      ).toEqual(previousSpec?.entities.report?.fields.title);
      expect(updatedSpec?.views, `${skillPath} must preserve unrelated views`).toEqual(previousSpec?.views);
      expect(updatedSpec?.flows, `${skillPath} must preserve unrelated flows`).toEqual(previousSpec?.flows);
    }
  });

  it('documents JSON-path diff output between spec.previous.json and spec.json', () => {
    for (const skillPath of diffSkillPaths) {
      const markdown = readMarkdown(skillPath);

      expect(markdown, `${skillPath} must read the previous snapshot`).toContain(
        '`.reforge/specs/<name>/spec.previous.json`'
      );
      expect(markdown, `${skillPath} must show a modified JSON path`).toContain(
        '~ entities.report.fields.status.options[2]: undefined -> archived'
      );
      expect(markdown, `${skillPath} must show an added JSON path`).toContain('+ views.reportDetail');
      expect(markdown, `${skillPath} must document the unchanged message`).toMatch(
        /前回スナップショット以降に変更はありません|No changes/
      );
    }
  });
});

describe('reforge-plan engine skill contracts', () => {
  it('keeps Claude Code and Codex plan skill documentation in sync', () => {
    for (const skillPath of planSkillPaths) {
      expect(existsSync(resolve(process.cwd(), skillPath)), `${skillPath} must exist`).toBe(true);
    }

    const [claudeMarkdown, codexMarkdown] = planSkillPaths.map(readMarkdown);

    expect(codexMarkdown).toBe(claudeMarkdown);
  });

  it('registers reforge-plan as an installable command skill', () => {
    const skillCommand: Partial<Record<string, string>> = SKILL_COMMAND;

    expect([...ALL_SKILLS]).toContain('reforge-plan');
    expect(skillCommand['reforge-plan']).toBe('plan');
  });

  it('documents the approval gate and TasksJson generation from every entity', () => {
    for (const skillPath of planSkillPaths) {
      const markdown = readMarkdown(skillPath);
      const samples = parseJsonCodeBlocks(markdown);
      const tasksSample = samples.find(isTasksJson);

      expect(markdown, `${skillPath} must refuse planning before approval`).toMatch(
        /meta\.approved[\s\S]*(?:false|`false`)[\s\S]*(?:refuse|拒否|実行しない)/
      );
      expect(markdown, `${skillPath} must guide render for approval`).toContain('/reforge-render');
      expect(tasksSample?.tasks, `${skillPath} must include a parseable tasks.json sample`).toEqual([
        {
          id: 'report',
          entity: 'report',
          status: 'pending',
          subtasks: ['db', 'api', 'ui', 'test']
        },
        {
          id: 'user',
          entity: 'user',
          status: 'pending',
          subtasks: ['db', 'api', 'ui', 'test']
        }
      ]);
    }
  });
});

describe('reforge question protocol consistency', () => {
  it('uses one identical question handling protocol section in init, resume, and update', () => {
    const sections = questionProtocolSkillPaths.map((skillPath) => {
      const markdown = readMarkdown(skillPath);
      const section = extractSecondLevelSection(markdown, '## 質問機能プロトコル');

      expect(section, `${skillPath} must include the shared question protocol section`).not.toBe('');
      return { skillPath, section };
    });

    const [canonical] = sections;

    for (const { skillPath, section } of sections) {
      expect(section, `${skillPath} must match the canonical protocol text`).toBe(canonical.section);
    }

    expect(canonical.section).toContain('Step 1: 取得');
    expect(canonical.section).toContain('Step 2: 提示');
    expect(canonical.section).toContain('Step 5: 反映');
    expect(canonical.section).toContain('Step 6: 移動');
    expect(canonical.section).toMatch(/最大\s*4\s*[問件]|up to 4|バッチ/i);
    expect(canonical.section).toContain('先頭 4 件のみ');
    expect(canonical.section).toContain('`resolves`');
    expect(canonical.section).toContain('`pending`');
    expect(canonical.section).toContain('`answered`');
    expect(canonical.section).toContain('`.reforge/specs/<name>/questions.json`');
  });
});

describe('reforge Audience and Style consistency', () => {
  it('uses one identical Audience and Style section in init, resume, answer, and update', () => {
    const sections = audienceStyleSkillPaths.map((skillPath) => {
      const markdown = readMarkdown(skillPath);
      const section = extractSecondLevelSection(markdown, '## Audience and Style');

      expect(section, `${skillPath} must include the Audience and Style section`).not.toBe('');
      return { skillPath, section };
    });

    const [canonical] = sections;

    for (const { skillPath, section } of sections) {
      expect(section, `${skillPath} must match the canonical Audience and Style text`).toBe(canonical.section);
    }

    expect(canonical.section).toContain('IT職企画担当');
    expect(canonical.section).toContain('分からない・AI におまかせ');
    expect(canonical.section).toContain('### 質問選択肢の供給源');
    expect(canonical.section).toContain('### コマンド表記の統一');
    expect(canonical.section).toContain('AI-DLC');
    expect(canonical.section).toContain('files_written');
    expect(canonical.section).toContain('questions_batch');
    expect(canonical.section).toContain('answered');
    expect(canonical.section).toMatch(/`options`/);
  });
});
