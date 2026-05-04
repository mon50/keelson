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
