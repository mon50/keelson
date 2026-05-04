---
name: reforge-impl
allowed-tools: Read, Write, Edit, Bash, AskUserQuestion
argument-hint: [entity]
---

# reforge-impl

Implement one entity from the approved Reforge specification.

## Source of Truth

- Read `.reforge/spec.json` before any implementation work.
- Read `.reforge/tasks.json` to identify and update the target entity task.
- Do not depend on external libraries or helper scripts from this skill file.

## Execution Contract

ゲートチェックは、tasks.jsonのステータス更新、DB/API/UI/テスト生成を含む全ての実装処理より前に必ず実行する。

1. `.reforge/spec.json` の存在を確認する。
   - 存在しない場合は「spec.jsonが見つかりません。`/reforge:init` を実行してください」と表示して停止する。
2. `meta.approved` が `true` であることを確認する。
   - `meta.approved` が `true` でない場合は「仕様が承認されていません。`/reforge:render` を実行して承認してください」と表示して停止する。
3. `.reforge/tasks.json` の存在を確認する。
   - 存在しない場合は「tasks.jsonが見つかりません。`/reforge:plan` を実行してください」と表示して停止する。
   - entity引数が省略された場合は、`.reforge/tasks.json` の `tasks` 配列を先頭から走査し、最初の `status: "pending"` タスクの `entity` を対象entityとして確定する。
   - 対象entityを確定したら、tasks.json に対応するタスクが存在することを確認する。
   - 対応するタスクが存在しない場合は「エンティティ `[entity]` のタスクが見つかりません。`/reforge:plan` を再実行してください」と表示して停止する。
4. `spec.tech` の完全性を確認する。
   - `frontend`, `backend`, `database`, `orm`, `styling`, `testing` のいずれかが欠如している場合は「`/reforge:resume` を実行して仕様を完成させてください」と表示して停止する。
5. `spec.entities[entity]` の定義を確認する。
   - entityが存在しない、または `fields` が空の場合は「`/reforge:resume` を実行してエンティティ定義を完成させてください」と表示して停止する。

entity引数の解析は `meta.approved` 確認後に行う。上記5つのゲートを全て通過した後でのみ、`.reforge/tasks.json` のステータス更新と実装を開始する。
実装は `.reforge/spec.json` に存在する情報だけから行い、spec.jsonに存在しない情報の収集に AskUserQuestion を使用しない。

## Zero-Context Read Protocol

以下の読み取りは `.reforge/spec.json` のみを情報源として実行する。不足情報を推測して補完してはならない。

1. `spec.tech` から技術スタックを読み取る。
   - `frontend` を読み取り、UIコンポーネント生成に使うフレームワークを確定する。
   - `backend` を読み取り、CRUD APIエンドポイント生成に使うフレームワークを確定する。
   - `database` を読み取り、DBマイグレーションの対象DBを確定する。
   - `orm` を読み取り、DBモデルとマイグレーション生成方式を確定する。
   - `styling` を読み取り、UIコンポーネントのスタイル方式を確定する。
   - `testing` を読み取り、単体テストとAPIテストのフレームワークを確定する。
   - 6フィールドのいずれかが欠如している場合は「`/reforge:resume` を実行して仕様を完成させてください」と表示して停止する。
2. `spec.entities[entity]` からDBテーブル定義、フィールド型、必須制約を読み取る。
   - `spec.entities[entity]` が存在しない、または `fields` が空の場合は「`/reforge:resume` を実行してエンティティ定義を完成させてください」と表示して停止する。
3. `spec.views` を読み取り、`entity` が対象entityと一致するviewだけを抽出する。
   - 抽出したviewの `type` と `fields` をUIコンポーネント生成に使用する。
4. `spec.flows` を読み取り、stepsまたはflow定義内で対象entityを参照するflowだけを抽出する。
   - 抽出したflowの `steps` をAPIまたはUIコンポーネントのビジネスロジックに反映する。

AskUserQuestionは既知情報の明確化に限り使用できる。AskUserQuestionをspec.jsonに存在しない情報の収集に使用しない。不足している `spec.tech`、`spec.entities[entity]`、`spec.views`、`spec.flows` の情報をAskUserQuestionで質問して補完してはならない。

## tasks.json Status Management Procedure

上記ゲートを全て通過し、DB / API / UI / テストの実装処理を開始する前に、`.reforge/tasks.json` の対象entityタスクの `status` を `"pending"` から `"in_progress"` に更新する。

1. 対象entityタスクの現在の `status` が `"pending"` であることを確認する。
2. `.reforge/tasks.json` を編集し、対象entityタスクだけの `status` を `"in_progress"` に変更する。
3. 開始前確認として `.reforge/tasks.json` を再読み取りし、対象entityタスクが `status: "in_progress"` になっていることを確認する。
4. status更新を確認できない場合は実装を進めない。

`"in_progress"` に更新した後でのみ、DB、API、UI、テストの各サブタスク実装を開始する。

## Implementation Error Rollback Procedure

DB、API、UI、テストのいずれかの実装または検証で失敗し、実装中にエラーが発生した場合は、完了報告や `"done"` 更新を行う前に `.reforge/tasks.json` の対象entityタスクの `status` を `"in_progress"` から `"pending"` に戻す。tasks.json の更新は対象タスクだけに限定し、可能な限り一時内容を書いてから置き換えるなど atomic に行い、エラー後に `status: "in_progress"` のまま残さない。

1. 発生したエラーメッセージを記録し、どのサブタスク（DB / API / UI / テスト / 検証）で失敗したかを特定する。
2. `.reforge/tasks.json` を再読み取りし、対象entityタスクの現在の `status` が `"in_progress"` であることを確認する。
3. 対象entityタスクだけの `status` を `"pending"` に戻す。
4. ロールバック後確認として `.reforge/tasks.json` を再読み取りし、対象entityタスクが `status: "pending"` になっていることを確認する。
5. `status: "pending"` を確認できない場合は完了報告しない。ロールバック失敗として、現在のtasks.json状態と元のエラーメッセージをユーザーに報告する。
6. `status: "pending"` を確認できた場合は、エラーメッセージとロールバック理由をユーザーに報告する。ロールバック理由には、実装失敗後に tasks.json の `status` が `"in_progress"` のまま残ることを防ぐため、対象entityタスクを再実行可能な `"pending"` に戻したことを含める。

## DB Migration Generation Procedure

DBマイグレーションは、ゲート通過後に `spec.tech.database` と `spec.tech.orm` の組み合わせに基づくDBマイグレーションファイルとして生成する。database と ORM の組み合わせを先に確定し、その組み合わせに対応するファイルパスと生成方式を選ぶ。

1. `spec.tech.database` を読み取り、SQL方言、主キー型、日時型、enum表現、NULL制約の書き方を確定する。
2. `spec.tech.orm` を読み取り、マイグレーションファイルの配置先、ファイル形式、モデル定義との同期方法を確定する。
3. `spec.entities[entity].fields` の全フィールドを走査し、各フィールドの `type`、`required`、`options` を必ず使用してスキーマ列を生成する。
   - 全フィールドの `type` をDB/ORMの型に変換する。例: `string` は文字列列、`text` は長文列、`number` は数値列、`boolean` は真偽値列、`date` は日付または日時列、`enum` は列挙値列として扱う。
   - 全フィールドの `required` をNULL制約に反映する。`required: true` は NOT NULL、`required` が `false` または未指定の場合は NULL許可として生成する。
   - 全フィールドの `options` を型制約に反映する。`type: "enum"` の場合は `options` の全値をenum定義、CHECK制約、またはORMの列挙型に含める。
4. entity名からテーブル名またはモデル名を決め、既存プロジェクトの命名規則が読み取れる場合はそれに合わせる。spec.jsonにない列や制約は追加しない。
5. 生成後、選択したORMのパスパターンにファイルが存在することを確認する。特に `spec.tech.orm: "Prisma"` の場合は `prisma/migrations/` 配下に生成されていることを確認できるようにする。

主要ORMのDBマイグレーションファイルパスパターン:

| ORM | パスパターン | 生成方針 |
| --- | --- | --- |
| Prisma | `prisma/migrations/{timestamp}_{entity}/migration.sql` | Prisma schemaと整合するSQL migrationを生成する。`spec.tech.orm: "Prisma"` の場合は必ず `prisma/migrations/` 配下を使う。 |
| TypeORM | `src/migrations/{timestamp}-{Entity}.ts` | `MigrationInterface` の `up` / `down` にテーブル作成とロールバックを記述する。 |
| Sequelize | `migrations/{timestamp}-create-{entity}.js` | `queryInterface.createTable` と `queryInterface.dropTable` を記述する。 |
| SQLAlchemy | `alembic/versions/{revision}_create_{entity}.py` | Alembic revisionとして `upgrade` / `downgrade` を記述する。 |
| ActiveRecord | `db/migrate/{timestamp}_create_{entity}.rb` | Rails migration classとして `create_table` と必要な制約を記述する。 |

## CRUD API Endpoint Generation Procedure

CRUD APIエンドポイントは、ゲート通過後に `spec.tech.backend` を読み取り、CRUD APIエンドポイント生成に使うバックエンドフレームワークを確定する。選択したフレームワークのファイルパス、ルーティング規約、リクエストパース方式、レスポンス形式に合わせて Create / Read / Update / Delete を実装する。

1. `spec.tech.backend` の値からバックエンド種別を決め、下表のパスパターンとコードパターンを選ぶ。
2. `spec.entities[entity].fields` の全フィールドをAPIリクエストとレスポンスの両方に含める。
   - 作成・更新リクエストでは、`spec.entities[entity].fields` の全フィールドを入力DTO、バリデーション、永続化データに含める。
   - レスポンスDTOでは、単体取得、一覧取得、作成、更新のレスポンスに全フィールドを含める。
   - POST と PUT/PATCH は全フィールドを受け取り、GET は全フィールドを返す。DELETE は削除結果または削除済みentityの識別情報を返す。
   - spec.jsonに存在しないフィールドはリクエスト/レスポンスに追加しない。
3. 各フィールドの `type`、`required`、`options` をAPI層のバリデーションに反映する。
   - `required: true` は作成リクエストで必須にする。
   - `type: "enum"` は `options` の全値だけを許可する。
   - 更新リクエストで部分更新を許す場合でも、更新可能フィールドの集合は `spec.entities[entity].fields` の全フィールドと一致させる。
4. `spec.flows` を読み取り、対象entityを参照するflowだけを抽出し、APIのビジネスロジックに反映する。
   - flowの `steps` をAPIのバリデーション、状態遷移、副作用に割り当てる。
   - 例: `draft` から `submitted` へのflowがある場合、更新APIで許可する状態遷移と不正遷移のエラー処理を実装する。
   - flowにentity参照がない場合はAPIへ推測ロジックを追加しない。
5. 生成後にAPIフィールドカバレッジ確認を行う。
   - `spec.entities[entity].fields` のキー一覧を作成し、リクエストDTO、レスポンスDTO、永続化処理で使われているフィールド一覧との差分を確認する。
   - 不足フィールドが1つでもある場合はAPI生成を未完了として扱い、追加実装してから完了報告する。

主要バックエンドのCRUD APIファイルパスとコードパターン:

| Backend | パスパターン | コードパターン |
| --- | --- | --- |
| Next.js API Routes | `src/app/api/{entity}/route.ts` | `export async function GET`, `export async function POST`, `export async function PUT`, `export async function DELETE` を定義し、各handlerで全フィールドを扱う。 |
| Express | `src/routes/{entity}.ts` | `router.get`, `router.post`, `router.put`, `router.delete` を定義し、`req.body` から全フィールドを検証して返す。 |
| FastAPI | `app/routers/{entity}.py` | `@router.get`, `@router.post`, `@router.put`, `@router.delete` とPydantic modelで全フィールドを定義する。 |
| Rails | `app/controllers/{entities}_controller.rb` | `def index`, `def show`, `def create`, `def update`, `def destroy` とstrong parametersで全フィールドを許可する。 |
| NestJS | `src/{entity}/{entity}.controller.ts` | `@Get()`, `@Post()`, `@Put()`, `@Delete()` とDTO classで全フィールドを定義する。 |

Next.js API Routes の最小パターン:

```ts
export async function GET() {
  // spec.entities[entity].fields の全フィールドを返す
}

export async function POST(request: Request) {
  // bodyから全フィールドを読み取り、required/options/flowを検証して保存する
}
```

Express の最小パターン:

```ts
router.post('/{entity}', async (req, res) => {
  // req.bodyから全フィールドを読み取り、作成結果として全フィールドを返す
});
```

FastAPI の最小パターン:

```py
@router.post('/{entity}')
def create(payload: EntityPayload):
    # Pydantic modelで全フィールドを受け取り、全フィールドを返す
    return payload
```

Rails の最小パターン:

```rb
def create
  # params.require(:entity).permit(...) に全フィールドを含める
end
```

NestJS の最小パターン:

```ts
@Post()
create(@Body() payload: CreateEntityDto) {
  // DTOに全フィールドを含め、作成結果として全フィールドを返す
}
```

## UI Component Generation Procedure

UIコンポーネントは、ゲート通過後に `spec.tech.frontend` を読み取り、UIコンポーネント生成に使うフロントエンドフレームワークを確定する。`spec.views` から `entity` が対象entityと一致するviewだけを抽出し、各viewの `type` が form / list / detail のどれかに一致するか確認してから対応コンポーネントを生成する。

1. `spec.tech.frontend` の値からフロントエンド種別を決め、下表のパスパターンを選ぶ。
2. `spec.views` のうち `entity` が対象entityと一致するviewだけを処理対象にする。
   - `type: "form"` のviewから、viewの `fields` を入力項目として持つ form 入力コンポーネントを生成し、作成または更新APIを呼ぶ送信ハンドラーを実装する。
   - `type: "list"` のviewから、viewの `fields` を表示する list 一覧コンポーネントを生成し、列、行またはカードとして一覧取得APIの結果を表示する。
   - `type: "detail"` のviewから、viewの `fields` を表示する detail 詳細コンポーネントを生成し、読み取り表示として単体取得APIの結果を表示する。
   - 未知のview typeがある場合は推測で生成せず、未対応typeとして報告する。
3. 各コンポーネントは `spec.entities[entity].fields` の型、必須制約、enum optionsをUIに反映する。
   - `required: true` は必須入力、必須表示、または空値エラーとして扱う。
   - `type: "enum"` は `options` の全値だけを選べるselect、radio、または同等の入力UIにする。
   - viewの `fields` にないフィールドを勝手に画面へ追加しない。
4. `spec.tech.styling` を読み取り、スタイリング方式を確定する。
   - Tailwind CSS の場合は `className` または対象フレームワークのclass属性へユーティリティクラスを直接指定し、フォーム、一覧、詳細表示の余白、入力、ボタン、エラー表示を構成する。
   - CSS Modules の場合は `{Entity}Form.module.css`、`{Entity}List.module.css`、`{Entity}Detail.module.css` または `.module.scss` を併置し、コンポーネントから import してclassを参照する。
   - その他のstyling値の場合は、既存プロジェクト内で同じstyling方式のコンポーネントを読み、同じ配置と命名に合わせる。spec.jsonにないデザイン要件は追加しない。
5. `spec.flows` を読み取り、対象entityを参照するflowだけを抽出し、UIコンポーネントのハンドラーに反映する。
   - flowの `steps` を form の onSubmit、list の行アクション onClick、detail の状態変更 onClick などのハンドラーへ割り当て、許可された状態遷移だけを実行する。
   - 例: `draft` から `submitted` へのflowがある場合、formのonSubmitまたはdetailの送信ボタンで状態遷移を実行し、不正な状態遷移はUI上で無効化またはエラー表示する。
   - flowにentity参照がない場合はUIへ推測ロジックを追加しない。
6. UIコンポーネント生成確認を行う。
   - 対象entityに一致するview typeごとに、form は `{Entity}Form`、list は `{Entity}List`、detail は `{Entity}Detail` のコンポーネントファイルが存在することを確認する。
   - `spec.views` に form / list / detail が全て存在する場合は、3種類すべてのコンポーネントが生成されていることを確認する。
   - 不足しているview typeのコンポーネントが1つでもある場合はUI生成を未完了として扱い、追加実装してから完了報告する。

主要フロントエンドのUIコンポーネントファイルパスパターン:

| Frontend | form | list | detail |
| --- | --- | --- | --- |
| Next.js | `src/components/{entity}/{Entity}Form.tsx` | `src/components/{entity}/{Entity}List.tsx` | `src/components/{entity}/{Entity}Detail.tsx` |
| React | `src/components/{entity}/{Entity}Form.tsx` | `src/components/{entity}/{Entity}List.tsx` | `src/components/{entity}/{Entity}Detail.tsx` |
| Vue | `src/components/{entity}/{Entity}Form.vue` | `src/components/{entity}/{Entity}List.vue` | `src/components/{entity}/{Entity}Detail.vue` |
| Svelte | `src/lib/components/{entity}/{Entity}Form.svelte` | `src/lib/components/{entity}/{Entity}List.svelte` | `src/lib/components/{entity}/{Entity}Detail.svelte` |
| Other | 既存プロジェクトのコンポーネント配置に合わせる | 既存プロジェクトのコンポーネント配置に合わせる | 既存プロジェクトのコンポーネント配置に合わせる |

Next.js / React の最小パターン:

```tsx
export function EntityForm() {
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    // view.fieldsの入力値を読み取り、required/options/flowを検証してAPIへ送信する
  }

  return <form onSubmit={onSubmit}>{/* view.fieldsの入力UI */}</form>;
}
```

Vue の最小パターン:

```vue
<script setup lang="ts">
async function onSubmit() {
  // view.fieldsの入力値を読み取り、required/options/flowを検証してAPIへ送信する
}
</script>
```

Svelte の最小パターン:

```svelte
<script lang="ts">
  async function onSubmit() {
    // view.fieldsの入力値を読み取り、required/options/flowを検証してAPIへ送信する
  }
</script>
```

## Test File Generation Procedure

テストファイルは、ゲート通過後に `spec.tech.testing` を読み取り、単体テストとAPIテストのテストフレームワークを確定してから生成する。選択したフレームワークのファイルパス、import方式、実行コマンドに合わせる。spec.jsonに存在しないテスト対象やフィールドは追加しない。

1. `spec.tech.testing` の値からテストフレームワークを決め、下表のパスパターンと実行コマンドを選ぶ。
2. 単体テストを生成する。
   - `spec.entities[entity].fields` の各フィールドについてバリデーションテストを作成する。
   - 各フィールドの `type`、`required`、`options` をテストケースに反映する。
   - `required: true` は欠落時のエラーを検証し、任意フィールドは欠落またはnull相当値の許容を検証する。
   - `type` は型不一致の拒否を検証する。`type: "enum"` は `options` 以外の値を拒否し、`options` の全値を受け入れることを検証する。
   - フィールドごとの正常系と異常系を最低1件ずつ含める。
3. APIのCRUD操作テストを生成する。
   - Create / Read / Update / Delete の各操作を、対象バックエンドのHTTPまたはhandler呼び出しパターンで検証する。
   - POST は全フィールドを含む作成リクエストと必須フィールド欠落の失敗を検証する。
   - GET は一覧取得または単体取得で全フィールドが返ることを検証する。
   - PUT/PATCH は更新可能フィールドの変更と、型不一致またはenum不正値の失敗を検証する。
   - DELETE は削除結果または削除済みentityの識別情報が返ることを検証する。
   - CRUDの各レスポンスに `spec.entities[entity].fields` の全フィールドが含まれることをアサートする。DELETEが全フィールドを返さない設計の場合は、削除対象の識別情報と削除後GETの非存在結果を検証する。
4. 生成後、テストファイルが存在し、選択した `spec.tech.testing` に対応するコマンドで実行可能であることを確認する。
   - テストコマンドが失敗した場合は完了報告しない。失敗内容に基づいてテストまたは生成コードを修正し、再実行する。
   - 実行コマンドがプロジェクト内に既に定義されている場合は既存コマンドを優先し、下表のフレームワーク別コマンドは対象テスト単体の確認に使う。

主要テストフレームワークのファイルパスパターンと実行コマンド:

| Testing | 単体テスト | APIテスト | 実行確認 |
| --- | --- | --- | --- |
| Vitest | `src/test/{entity}/components.test.tsx` | `src/test/{entity}/api.test.ts` | `npx vitest run src/test/{entity}/api.test.ts` |
| Jest | `__tests__/{entity}/components.test.tsx` | `__tests__/{entity}/api.test.ts` | `npx jest __tests__/{entity}/api.test.ts` |
| pytest | `tests/test_{entity}_unit.py` | `tests/test_{entity}_api.py` | `pytest tests/test_{entity}_api.py` |
| RSpec | `spec/models/{entity}_spec.rb` | `spec/requests/{entities}_spec.rb` | `bundle exec rspec spec/requests/{entities}_spec.rb` |

Vitest の最小パターン:

```ts
import { describe, expect, it } from 'vitest';

describe('{entity} validation', () => {
  it('validates each spec.entities[entity].fields entry', () => {
    // required/type/options の正常系と異常系をフィールドごとに検証する
  });
});
```

pytest の最小パターン:

```py
def test_create_rejects_missing_required_field():
    # POST相当の入力で required フィールド欠落を検証する
    assert True
```

RSpec の最小パターン:

```rb
RSpec.describe 'entities API', type: :request do
  it 'returns all spec fields on create' do
    # POSTのレスポンスに全フィールドが含まれることを検証する
  end
end
```

## Completion Status Update

DB、API、UI、テストの全サブタスクが完了し、生成ファイルとテスト実行可能性を確認した後で、`.reforge/tasks.json` の対象entityタスクの `status` を `"in_progress"` から `"done"` に更新する。

1. DBマイグレーション、CRUD APIエンドポイント、UIコンポーネント、単体テストおよびAPIテストの各確認が完了していることを確認する。
2. 対象entityタスクの現在の `status` が `"in_progress"` であることを確認する。
3. `.reforge/tasks.json` を編集し、対象entityタスクだけの `status` を `"done"` に変更する。
4. 完了後確認として `.reforge/tasks.json` を再読み取りし、対象entityタスクが `status: "done"` になっていることを確認する。
5. status更新を確認できない場合は完了報告しない。
