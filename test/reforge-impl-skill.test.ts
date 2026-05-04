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

  it('documents the tasks.json gate before implementation starts', () => {
    const markdown = readImplSkill();

    expect(markdown).toContain(
      'tasks.jsonが見つかりません。`/reforge:plan` を実行してください'
    );
    expect(markdown).toMatch(
      /`\.reforge\/tasks\.json` の存在を確認する。[\s\S]*tasks\.jsonが見つかりません。`\/reforge:plan` を実行してください[\s\S]*停止/
    );
    expect(markdown.indexOf('`.reforge/tasks.json` の存在を確認する。')).toBeGreaterThan(
      markdown.indexOf('`meta.approved` が `true` であることを確認する。')
    );
  });

  it('documents entity resolution from the first pending tasks.json task when omitted', () => {
    const markdown = readImplSkill();

    expect(markdown).toContain(
      'entity引数が省略された場合は、`.reforge/tasks.json` の `tasks` 配列を先頭から走査し、最初の `status: "pending"` タスクの `entity` を対象entityとして確定する。'
    );
    expect(markdown.indexOf('entity引数が省略された場合')).toBeGreaterThan(
      markdown.indexOf('`.reforge/tasks.json` の存在を確認する。')
    );
    expect(markdown.indexOf('entity引数が省略された場合')).toBeLessThan(
      markdown.indexOf('`spec.tech` の完全性を確認する。')
    );
  });

  it('documents the blocking message when the selected entity has no task', () => {
    const markdown = readImplSkill();

    expect(markdown).toContain(
      'エンティティ `[entity]` のタスクが見つかりません。`/reforge:plan` を再実行してください'
    );
    expect(markdown).toMatch(
      /対象entityを確定したら[\s\S]*tasks\.json[\s\S]*対応するタスク[\s\S]*エンティティ `\[entity\]` のタスクが見つかりません。`\/reforge:plan` を再実行してください[\s\S]*停止/
    );
  });

  it('documents the zero-context read protocol for tech, entity, views, and flows', () => {
    const markdown = readImplSkill();

    expect(markdown).toContain('## Zero-Context Read Protocol');

    for (const field of ['frontend', 'backend', 'database', 'orm', 'styling', 'testing']) {
      expect(markdown).toMatch(
        new RegExp(`spec\\.tech[\\s\\S]*\`${field}\`[\\s\\S]*読み取`)
      );
    }

    expect(markdown).toMatch(
      /`spec\.entities\[entity\]` からDBテーブル定義、フィールド型、必須制約を読み取る/
    );
    expect(markdown).toMatch(
      /`spec\.entities\[entity\]` が存在しない、または `fields` が空の場合[\s\S]*`\/reforge:resume` を実行してエンティティ定義を完成させてください[\s\S]*停止/
    );
    expect(markdown).toMatch(
      /`spec\.views` を読み取り、`entity` が対象entityと一致するviewだけを抽出する/
    );
    expect(markdown).toMatch(
      /`spec\.flows` を読み取り、stepsまたはflow定義内で対象entityを参照するflowだけを抽出する/
    );
  });

  it('forbids AskUserQuestion for missing spec.json information in implementation steps', () => {
    const markdown = readImplSkill();

    expect(markdown).toMatch(
      /AskUserQuestion[\s\S]*spec\.jsonに存在しない情報の収集に使用しない/
    );
    expect(markdown).toMatch(
      /不足している `spec\.tech`、`spec\.entities\[entity\]`、`spec\.views`、`spec\.flows` の情報をAskUserQuestionで質問して補完してはならない/
    );
  });

  it('documents DB migration generation from the database and ORM combination', () => {
    const markdown = readImplSkill();

    expect(markdown).toContain('## DB Migration Generation Procedure');
    expect(markdown).toMatch(
      /`spec\.tech\.database` と `spec\.tech\.orm` の組み合わせ[\s\S]*DBマイグレーションファイル/
    );
    expect(markdown).toMatch(
      /database と ORM の組み合わせを先に確定[\s\S]*ファイルパス[\s\S]*生成方式/
    );
  });

  it('requires all entity fields including type, required, and options for migration schema generation', () => {
    const markdown = readImplSkill();

    expect(markdown).toMatch(
      /`spec\.entities\[entity\]\.fields` の全フィールド/
    );

    for (const fieldProperty of ['type', 'required', 'options']) {
      expect(markdown).toMatch(
        new RegExp(`全フィールド[\\s\\S]*\`${fieldProperty}\``)
      );
    }

    expect(markdown).toMatch(
      /`required: true`[\s\S]*NOT NULL[\s\S]*`required` が `false` または未指定[\s\S]*NULL許可/
    );
    expect(markdown).toMatch(
      /`type: "enum"`[\s\S]*`options` の全値/
    );
  });

  it('lists DB migration path patterns for the major ORMs', () => {
    const markdown = readImplSkill();

    const ormPathPatterns = [
      ['Prisma', 'prisma/migrations/{timestamp}_{entity}/migration.sql'],
      ['TypeORM', 'src/migrations/{timestamp}-{Entity}.ts'],
      ['Sequelize', 'migrations/{timestamp}-create-{entity}.js'],
      ['SQLAlchemy', 'alembic/versions/{revision}_create_{entity}.py'],
      ['ActiveRecord', 'db/migrate/{timestamp}_create_{entity}.rb']
    ];

    for (const [orm, pathPattern] of ormPathPatterns) {
      expect(markdown).toContain(orm);
      expect(markdown).toContain(pathPattern);
    }
  });

  it('makes Prisma migrations verifiable under prisma/migrations', () => {
    const markdown = readImplSkill();

    expect(markdown).toMatch(
      /`spec\.tech\.orm: "Prisma"`[\s\S]*`prisma\/migrations\/` 配下/
    );
    expect(markdown).toMatch(
      /Prisma[\s\S]*`prisma\/migrations\/\{timestamp\}_\{entity\}\/migration\.sql`/
    );
  });
});
