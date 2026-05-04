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
