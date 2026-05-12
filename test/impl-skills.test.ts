import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const implSkillPath = '.claude/skills/reforge-impl/SKILL.md';
const verifySkillPath = '.claude/skills/reforge-verify/SKILL.md';

function readImplSkill(): string {
  return readFileSync(resolve(process.cwd(), implSkillPath), 'utf8');
}

function readVerifySkill(): string {
  return readFileSync(resolve(process.cwd(), verifySkillPath), 'utf8');
}

describe('reforge-verify Claude Code skill scaffold', () => {
  it('exists at the expected path and declares the required frontmatter', () => {
    expect(existsSync(resolve(process.cwd(), verifySkillPath))).toBe(true);

    const markdown = readVerifySkill();

    expect(markdown).toContain('name: reforge-verify');
    expect(markdown).toContain('allowed-tools: Read, Bash');
  });

  it('does not declare Write or Edit in allowed-tools (read-only constraint)', () => {
    const markdown = readVerifySkill();
    const frontmatter = markdown.split('---')[1] ?? '';

    expect(frontmatter).not.toContain('Write');
    expect(frontmatter).not.toContain('Edit');
  });

  it('explicitly states that meta.approved status does not block execution', () => {
    const markdown = readVerifySkill();

    expect(markdown).toMatch(
      /meta\.approved[\s\S]*状態に関わらず実行|実行をブロックしない|ブロックしない[\s\S]*meta\.approved/
    );
  });
});

describe('reforge-verify entity matching logic', () => {
  it('documents five check categories per entity: migration, API, field coverage, UI component, and tests', () => {
    const markdown = readVerifySkill();

    expect(markdown).toContain('チェック1: DBマイグレーション存在確認');
    expect(markdown).toContain('チェック2: APIエンドポイント存在確認');
    expect(markdown).toContain('チェック3: フィールドカバレッジ確認');
    expect(markdown).toContain('チェック4: UIコンポーネント存在確認');
    expect(markdown).toContain('チェック5: テストファイル存在確認');
  });

  it('determines file path patterns dynamically from spec.tech ORM, backend, frontend, and testing fields', () => {
    const markdown = readVerifySkill();

    expect(markdown).toContain('spec.tech.orm');
    expect(markdown).toContain('spec.tech.backend');
    expect(markdown).toContain('spec.tech.frontend');
    expect(markdown).toContain('spec.tech.testing');
  });

  it('lists ORM-specific DB migration path patterns for the five major ORMs', () => {
    const markdown = readVerifySkill();

    expect(markdown).toContain('prisma/migrations/');
    expect(markdown).toContain('src/migrations/');
    expect(markdown).toContain('alembic/versions/');
    expect(markdown).toContain('db/migrate/');
  });

  it('classifies MISSING_MIGRATION, MISSING_API, MISSING_FIELD_COVERAGE, MISSING_UI_COMPONENT as errors', () => {
    const markdown = readVerifySkill();

    for (const code of ['MISSING_MIGRATION', 'MISSING_API', 'MISSING_FIELD_COVERAGE', 'MISSING_UI_COMPONENT']) {
      expect(markdown, `${code} should be marked as error`).toMatch(
        new RegExp(`${code}[\\s\\S]{0,60}error|重篤度.*error[\\s\\S]{0,60}${code}`)
      );
    }
  });

  it('classifies MISSING_TEST and TASK_INCOMPLETE as warnings, not errors', () => {
    const markdown = readVerifySkill();

    expect(markdown).toMatch(/MISSING_TEST[\s\S]{0,60}warning|重篤度.*warning[\s\S]{0,60}MISSING_TEST/);
    expect(markdown).toMatch(/TASK_INCOMPLETE[\s\S]{0,60}warning|重篤度.*warning[\s\S]{0,60}TASK_INCOMPLETE/);
  });

  it('maps form, list, and detail view types to EntityForm, EntityList, EntityDetail component names', () => {
    const markdown = readVerifySkill();

    expect(markdown).toContain('{Entity}Form');
    expect(markdown).toContain('{Entity}List');
    expect(markdown).toContain('{Entity}Detail');
    expect(markdown).toMatch(
      /form[\s\S]*\{Entity\}Form[\s\S]*list[\s\S]*\{Entity\}List[\s\S]*detail[\s\S]*\{Entity\}Detail/
    );
  });
});

describe('reforge-verify batch report output', () => {
  it('collects all entity check results before outputting the report (途中停止禁止)', () => {
    const markdown = readVerifySkill();

    expect(markdown).toContain('途中停止禁止');
    expect(markdown).toMatch(/全entityの全チェック項目[\s\S]*完了した後[\s\S]*一括レポートを出力する/);
    expect(markdown).toMatch(/途中でエラーが見つかっても最後まで全件チェックを続ける/);
  });

  it('confirms tasks.json completion status and warns about incomplete tasks', () => {
    const markdown = readVerifySkill();

    expect(markdown).toMatch(/tasks\.json[\s\S]*全タスク[\s\S]*`status`[\s\S]*確認/);
    expect(markdown).toContain('TASK_INCOMPLETE');
  });

  it('reports ✔ verify passed when the error list is empty', () => {
    const markdown = readVerifySkill();

    expect(markdown).toContain('✔ verify passed');
    expect(markdown).toMatch(/エラーリスト[\s\S]*空[\s\S]*✔ verify passed/);
  });

  it('reports ✖ verify failed with a divergence list when errors exist', () => {
    const markdown = readVerifySkill();

    expect(markdown).toContain('✖ verify failed');
    expect(markdown).toMatch(/エラーリスト[\s\S]*1件以上[\s\S]*✖ verify failed/);
  });

  it('warnings do not affect the passed or failed verdict', () => {
    const markdown = readVerifySkill();

    expect(markdown).toMatch(
      /警告[\s\S]*(passed|failed)[\s\S]*判定に影響しない|(MISSING_TEST|TASK_INCOMPLETE)[\s\S]*判定.*影響しない/
    );
  });
});

describe('impl → verify integration: artifact symmetry and gate behavior', () => {
  it('impl and verify skills document the same four artifact categories', () => {
    const implMarkdown = readImplSkill();
    const verifyMarkdown = readVerifySkill();

    expect(implMarkdown).toContain('DB Migration Generation Procedure');
    expect(implMarkdown).toContain('CRUD API Endpoint Generation Procedure');
    expect(implMarkdown).toContain('UI Component Generation Procedure');
    expect(implMarkdown).toContain('Test File Generation Procedure');

    expect(verifyMarkdown).toContain('MISSING_MIGRATION');
    expect(verifyMarkdown).toContain('MISSING_API');
    expect(verifyMarkdown).toContain('MISSING_UI_COMPONENT');
    expect(verifyMarkdown).toContain('MISSING_TEST');
  });

  it('impl skill blocks when meta.approved is not true; verify skill does not block', () => {
    const implMarkdown = readImplSkill();
    const verifyMarkdown = readVerifySkill();

    expect(implMarkdown).toContain(
      '仕様が承認されていません。`/reforge-render` を実行して承認してください'
    );
    expect(verifyMarkdown).toMatch(
      /meta\.approved[\s\S]*状態に関わらず実行|実行をブロックしない/
    );
    expect(verifyMarkdown).not.toMatch(
      /meta\.approved が `true`[\s\S]{0,100}停止|仕様が承認されていません/
    );
  });

  it('impl skill blocks when spec.json, tasks.json, or spec.tech fields are missing', () => {
    const implMarkdown = readImplSkill();

    expect(implMarkdown).toContain(
      'spec.jsonが見つかりません。`/reforge-init` を実行してください'
    );
    expect(implMarkdown).toContain(
      'tasks.jsonが見つかりません。`/reforge-plan` を実行してください'
    );
    expect(implMarkdown).toMatch(
      /`\/reforge-resume` を実行して仕様を完成させてください/
    );
  });

  it('verify skill documents ✔ verify passed after a complete impl run', () => {
    const verifyMarkdown = readVerifySkill();

    expect(verifyMarkdown).toContain('✔ verify passed');
    expect(verifyMarkdown).toMatch(/エラーリスト[\s\S]*空[\s\S]*✔ verify passed/);
  });
});
