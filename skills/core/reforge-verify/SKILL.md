---
name: reforge-verify
description: Verify that the implementation matches the approved Reforge specification. Read-only check against spec.entities, tech-driven file path patterns, and tasks.json completion status. Does not require meta.approved (informational command).
allowed-tools: Read, Bash
---

# reforge-verify

Verify that the implementation matches the approved Reforge specification. Read-only: this skill never writes or modifies files.

## Canonical Paths

- `SPECS_DIR = ".reforge/specs"`
- `SPEC_PATH = ".reforge/specs/<name>/spec.json"` (resolved by Spec Resolution)
- `TASKS_PATH = ".reforge/specs/<name>/tasks.json"`

## Spec Resolution (reforge-verify [<spec-name>])

1. 引数で spec 名が渡された場合 → `.reforge/specs/<name>/` が存在すれば使用、なければエラー報告して `blocked`。
2. 引数なし + `.reforge/specs/` 内の spec が 1 つ → 自動選択して続行。
3. 引数なし + specs が複数 → 一覧表示して AskUserQuestion で選択を求める。
4. 引数なし + specs が 0 → `/reforge-init "<説明>"` を案内して `blocked`。

選択された spec 名を `<name>` として Canonical Paths を解決する。

## Source of Truth

- Run Spec Resolution to determine `<name>`, then read `SPEC_PATH` to obtain the full entity and view definitions.
- Read `TASKS_PATH` to check whether all tasks are marked `"done"`.
- Read generated implementation files to confirm they exist and cover the required fields.
- Do not depend on external libraries or helper scripts from this skill file.

## Execution Contract

このスキルは **`meta.approved` の状態に関わらず実行する**（informationalコマンド）。`meta.approved` が `false` でも実行をブロックしない。全照合項目を完了してから一括報告する（途中停止禁止）。

1. Spec Resolution を実行して `<name>` と `SPEC_PATH`、`TASKS_PATH` を確定する。
2. `SPEC_PATH` の存在を確認する。
   - 存在しない場合は「spec.jsonが見つかりません。`/reforge-init` を実行してください」と表示して停止する。
3. `SPEC_PATH` の `meta` と `entities` を読み取る（`meta.approved` の値は情報として記録するのみ）。
4. `spec.tech` を読み取り、ファイルパスパターンを動的に決定する。
5. 全 entity に対して照合チェックを実行する（詳細はEntityマッチングロジックセクション参照）。
6. `spec.context` が存在する場合は Brownfield / Greenfield context を情報として読み取り、`allowedWriteAreas`、`protectedAreas`、`acceptanceCriteria`、`risks` をレポート対象に追加する。
7. `TASKS_PATH` を読み取り、全タスクの `status` を確認する。
8. 全照合完了後に一括レポートを出力する。

## Entity Matching Logic

`spec.tech` を読み取り、ORM / backend / frontend / testing の各値からファイルパスパターンを動的に決定する。`spec.entities` の全entityについて以下の5項目を確認する。途中でエラーや欠落を検出しても停止せず、全entityの全項目をチェックしてから結果を収集する。

### ファイルパスパターンの決定

```
DBマイグレーションパスの決定 (spec.tech.orm):
  Prisma       → prisma/migrations/ 配下に {entity} を含むディレクトリまたは .sql ファイル
  TypeORM      → src/migrations/ 配下に {Entity} を含む .ts ファイル
  Sequelize    → migrations/ 配下に {entity} を含む .js ファイル
  SQLAlchemy   → alembic/versions/ 配下に {entity} を含む .py ファイル
  ActiveRecord → db/migrate/ 配下に {entity} を含む .rb ファイル

APIエンドポイントパスの決定 (spec.tech.backend):
  Next.js API Routes → src/app/api/{entity}/route.ts または src/pages/api/{entity}.ts
  Express            → src/routes/{entity}.ts または src/routes/{entity}.js
  FastAPI            → app/routers/{entity}.py
  Rails              → app/controllers/{entities}_controller.rb
  NestJS             → src/{entity}/{entity}.controller.ts

UIコンポーネントパスの決定 (spec.tech.frontend + spec.tech.styling):
  Next.js / React → src/components/{entity}/{Entity}{Type}.tsx
  Vue             → src/components/{entity}/{Entity}{Type}.vue
  Svelte          → src/lib/components/{entity}/{Entity}{Type}.svelte
  ※ {Type} は view.type に応じて Form / List / Detail

テストファイルパスの決定 (spec.tech.testing):
  Vitest / Jest → src/test/{entity}/ または __tests__/{entity}/
  pytest        → tests/test_{entity}_*.py
  RSpec         → spec/models/{entity}_spec.rb および spec/requests/{entities}_spec.rb
```

### チェック項目

各entityについて以下の順番で確認する。エラーは全て収集し、途中で停止しない。

**チェック1: DBマイグレーション存在確認**
- `spec.tech.orm` の値からDBマイグレーションのパスパターンを決定する。
- Bash の `find` または `ls` を使ってパターンに一致するファイルまたはディレクトリを探す。
- 見つからない場合は `MISSING_MIGRATION: {entity}` としてエラーリストに追加する（重篤度: error）。

**チェック2: APIエンドポイント存在確認**
- `spec.tech.backend` の値からAPIエンドポイントのパスパターンを決定する。
- ファイルが存在するか確認する。
- 見つからない場合は `MISSING_API: {entity}` としてエラーリストに追加する（重篤度: error）。

**チェック3: フィールドカバレッジ確認**
- APIファイルが存在する場合のみ実行する（`MISSING_API` の場合はスキップ）。
- `spec.entities[entity].fields` の全フィールドキーのリストを作成する。
- APIファイルの内容を Read ツールで読み取り、各フィールドキーが含まれているか確認する（文字列検索）。
- 含まれていないフィールドがある場合は `MISSING_FIELD_COVERAGE: {entity}.{field}` としてエラーリストに追加する（重篤度: error）。

**チェック4: UIコンポーネント存在確認**
- `spec.views` から `entity` フィールドが対象entityと一致するviewだけを抽出する。
- 各viewの `type`（form / list / detail）に対応するコンポーネントファイルパスを決定する。
  - form   → `{Entity}Form.{ext}`
  - list   → `{Entity}List.{ext}`
  - detail → `{Entity}Detail.{ext}`
- ファイルが存在するか確認する。
- 見つからない場合は `MISSING_UI_COMPONENT: {entity}/{type}` としてエラーリストに追加する（重篤度: error）。

**チェック5: テストファイル存在確認**
- `spec.tech.testing` の値からテストファイルのパスパターンを決定する。
- Bash の `find` を使ってパターンに一致するファイルが存在するか確認する。
- 見つからない場合は `MISSING_TEST: {entity}` として警告リストに追加する（重篤度: warning）。

## Report Output

全entityの全チェック項目（チェック1〜5）を完了した後、一括レポートを出力する。途中停止禁止。途中でエラーが見つかっても最後まで全件チェックを続ける。

### tasks.json 全タスク完了確認

全entityの照合チェック後に `TASKS_PATH` を読み取る。
- tasks.json が存在しない場合は `TASK_INCOMPLETE: tasks.json が見つかりません` として警告リストに追加する（重篤度: warning）。
- tasks.json が存在する場合は全タスクの `status` を確認し、`"done"` でないタスクがあれば `TASK_INCOMPLETE: {entity}（status: {status}）` として警告リストに追加する（重篤度: warning）。

### Brownfield / Acceptance Context

`spec.context` が存在する場合は、verify レポートに以下の情報セクションを追加する。これは構造照合の補助であり、error/pass 判定を誇張してはならない。

- `context.mode` が `"brownfield"` の場合、`allowedWriteAreas` と `protectedAreas` を表示する。
- 実装ファイルのパスが `protectedAreas` に一致することを読み取りだけで確認できた場合は `PROTECTED_AREA_TOUCHED` を warning として追加する。
- `acceptanceCriteria` は手動確認チェックリストとして表示する。ファイル存在や文字列検索だけで満たしたと断定できない項目は `manual check required` として残す。
- `risks` は残リスクとして表示する。verify が自動的にリスクを解消したとは報告しない。

### レポート形式

全チェック完了後に以下の形式でレポートを出力する。

```
## Reforge Verify Report

Spec: .reforge/specs/<name>/spec.json
meta.approved: {true / false / (未設定)}

### Entity Verification

{entity}:
  ✔ DB migration: {ファイルパス}
  ✖ DB migration: MISSING_MIGRATION
  ✔ API endpoint: {ファイルパス}
  ✖ API endpoint: MISSING_API
  ✔ Field coverage: all {n} fields covered
  ✖ Field coverage: MISSING_FIELD_COVERAGE: {field}
  ✔ UI components: {ファイルパス群}
  ✖ UI component: MISSING_UI_COMPONENT: {entity}/{type}
  ✔ Tests: {ファイルパス群}
  ⚠ Tests: MISSING_TEST

### Tasks Status

  ✔ All tasks done
  ⚠ TASK_INCOMPLETE: {entity}（status: {status}）

---
✔ verify passed
（または）
✖ verify failed

Errors ({n}):
  - MISSING_MIGRATION: {entity}
  - MISSING_API: {entity}
  - MISSING_FIELD_COVERAGE: {entity}.{field}
  - MISSING_UI_COMPONENT: {entity}/{type}

Warnings ({n}):
  - MISSING_TEST: {entity}
  - TASK_INCOMPLETE: {entity}（status: {status}）
```

### 結果判定ルール

- エラーリスト（`MISSING_MIGRATION`, `MISSING_API`, `MISSING_FIELD_COVERAGE`, `MISSING_UI_COMPONENT`）が空 → `✔ verify passed`
- エラーリストに1件以上ある → `✖ verify failed` + エラー一覧
- 警告（`MISSING_TEST`, `TASK_INCOMPLETE`）は passed / failed の判定に影響しない
