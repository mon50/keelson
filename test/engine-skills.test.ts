import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import type { QuestionsJson, SpecJson } from '../src/types';

const initSkillPaths = [
  '.claude/skills/reforge-init/SKILL.md',
  '.agents/skills/reforge-init/SKILL.md'
];

const requiredTechFields = ['frontend', 'backend', 'database', 'orm', 'styling', 'testing'] as const;

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

function isTechQuestionsSample(value: unknown): value is QuestionsJson {
  if (!isQuestionsJson(value)) {
    return false;
  }

  const questionIds = value.pending.map((question) => question.id);
  return requiredTechFields.every((field) => questionIds.includes(`define_tech_${field}`));
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

  it('documents pending questions for every uninferable tech field', () => {
    for (const skillPath of initSkillPaths) {
      const markdown = readMarkdown(skillPath);
      const samples = parseJsonCodeBlocks(markdown);
      const questionsSample = samples.find(isTechQuestionsSample);

      expect(questionsSample, `${skillPath} must include a parseable questions.json sample`).toBeTruthy();
      expect(questionsSample?.answered).toEqual([]);

      for (const field of requiredTechFields) {
        expect(markdown, `${skillPath} must document define_tech_${field}`).toContain(
          `define_tech_${field}`
        );
        expect(markdown, `${skillPath} must resolve tech.${field}`).toContain(`tech.${field}`);
      }

      const pendingQuestionIds = questionsSample?.pending.map((question) => question.id) ?? [];
      expect(pendingQuestionIds).toEqual(requiredTechFields.map((field) => `define_tech_${field}`));

      for (const question of questionsSample?.pending ?? []) {
        expect(question).toMatchObject({
          phase: 'tech',
          type: 'text'
        });
        expect(question.resolves).toEqual([question.id.replace('define_tech_', 'tech.')]);
      }
    }
  });
});
