import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const implSkillPath = '.claude/skills/reforge-impl/SKILL.md';

function readImplSkill(): string {
  return readFileSync(resolve(process.cwd(), implSkillPath), 'utf8');
}

describe('reforge-impl Claude Code skill scaffold', () => {
  it('declares the required frontmatter for the optional entity argument', () => {
    expect(existsSync(resolve(process.cwd(), implSkillPath))).toBe(true);

    const markdown = readImplSkill();

    expect(markdown).toContain('name: reforge-impl');
    expect(markdown).toContain('allowed-tools: Read, Write, Edit, Bash, AskUserQuestion');
    expect(markdown).toContain('argument-hint: [entity]');
  });

  it('documents the mandatory preflight gate order before any implementation work', () => {
    const markdown = readImplSkill();

    expect(markdown).toContain(
      'ゲートチェックは、tasks.jsonのステータス更新、DB/API/UI/テスト生成を含む全ての実装処理より前に必ず実行する。'
    );

    const orderedSteps = [
      '1. `.reforge/spec.json` の存在を確認する。',
      '2. `meta.approved` が `true` であることを確認する。',
      '3. `.reforge/tasks.json` の存在を確認する。',
      '4. `spec.tech` の完全性を確認する。',
      '5. `spec.entities[entity]` の定義を確認する。'
    ];

    let lastIndex = -1;
    for (const step of orderedSteps) {
      const nextIndex = markdown.indexOf(step);
      expect(nextIndex, `missing gate step: ${step}`).toBeGreaterThan(lastIndex);
      lastIndex = nextIndex;
    }

    expect(markdown.indexOf('entity引数の解析')).toBeGreaterThan(
      markdown.indexOf('2. `meta.approved` が `true` であることを確認する。')
    );
  });

  it('documents exact blocking messages for missing or unapproved spec.json', () => {
    const markdown = readImplSkill();

    expect(markdown).toContain(
      'spec.jsonが見つかりません。`/reforge:init` を実行してください'
    );
    expect(markdown).toContain(
      '仕様が承認されていません。`/reforge:render` を実行して承認してください'
    );
    expect(markdown).toMatch(
      /`meta\.approved` が `true` でない場合[\s\S]*仕様が承認されていません。`\/reforge:render` を実行して承認してください[\s\S]*停止/
    );
  });
});
