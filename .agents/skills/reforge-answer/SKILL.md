---
name: reforge-answer
description: マニュアルモード用の Q&A 専用スキル。pending な質問をバッチで提示して回答を spec.json に反映する。フェーズマップや NextAction は出さない。
allowed-tools: Read, Write, Edit, Glob, AskUserQuestion
---

# reforge-answer

## Core Rule

- Think in English, respond to the user in the language specified by `meta.lang`.
- Treat `.reforge/specs/<name>/spec.json` as the single source of truth for the product specification.
- このスキルは **質問の提示と回答記録のみ** を行う。フェーズマップ、NextAction、次フェーズの案内は出力しない。
- ライフサイクルナビゲーションが必要な場合は `/reforge-resume` を使用する（ナビゲーターモード）。
- `/reforge-answer` はマニュアルモードでの Q&A 専用エンドポイント。
- 1 回のスキル実行で `AskUserQuestion` を呼ぶのは 1 度きり。pending 件数に関係なく常に先頭 4 件までをバッチ提示し、残りは次の実行で処理する（後述「質問機能プロトコル」参照）。
- Keep the skill self-contained. Do not require external prompt files.

## Audience and Style (非エンジニア対応)

> **このセクションは全 reforge-* スキル（init / resume / answer / update）で完全に同一のテキストとして共有する正準セクション**。修正は4ファイル同時に適用し、テストで一致を保証する。

このスキルは **IT職企画担当レベルの読者** が直接使えることを想定する（AI-DLC = AI Development Life Cycle における Mob Elaboration = 非エンジニアも含めた集合的要件詰めに、企画職を組み込む方針）。以下を厳守する:

- **専門用語には日本語平易表現を併記する**。これは全節横断のルールとして適用する。例:
  - `Inception 層`（最初に決めること: 誰向け・何のため・何が必要か）
  - `Construction 層`（次に決めること: データ・画面・処理・技術）
  - `Prompt Kernel`（このスキル全体で共通する基本前提）
  - `Output Contract`（実行の終了形式）
  - `Quality Gate`（書き込み前の最終確認）
  - `text`（自由記述） / `single_choice`（ひとつだけ選ぶ） / `multi_choice`（複数選べる） / `multi_input`（複数行の自由記述） / `confirm`（はい・いいえ確認）
  - `slug`（英数字のキー名）
  - `normalized`（表記揺れを揃えた状態）
  - **JSON 記法**: `{}`（空のオブジェクト = 中身がない箱）/ `[]`（空の配列 = 中身がないリスト）/ `""`（空文字 = 中身がない文字列）
  - **`phase` の 9 値**:
    - `meta`（プロダクト全体のメタ情報: 名前・言語など）
    - `audience`（ターゲットユーザー: 誰のためのプロダクトか）
    - `intent`（プロダクトの目的: どんな課題を解決するか）
    - `requirements`（ユーザーストーリー: 何ができるべきか）
    - `data`（エンティティ・データ構造: 何のデータを扱うか）
    - `flows`（ユーザーフロー: 操作の流れ）
    - `views`（画面定義: ユーザーが見る画面）
    - `tech`（技術スタック: 何で作るか）
    - `update`（既存仕様への変更要求: `/reforge-update` 専用）
  - **Lifecycle ステージ語彙**: Output Contract が定義する 6 種類のみ使う:
    - `files_written`（書き込み完了）
    - `questions_batch`（質問をバッチ提示中・AskUserQuestion 経由）
    - `answered`（回答を反映完了）
    - `blocked`（前提が満たされず中断）
    - `complete`（処理完了・変更なし）
- **質問選択肢には必ず「分からない・AI におまかせ」を含める**。tech 質問・enum 選択質問・Inception の選択型質問（`multi_choice` 型など）すべてに適用する。ユーザーが判断できない可能性がある質問では、必ず「分からない」と回答できる経路を確保する。
- 自由記述型（`text` / `multi_input`）の質問でも、ユーザーが「分からない・AI におまかせ」とだけ書ける旨を質問文に注記する。
- 「分からない・AI におまかせ」が選択されたフィールドは `""` または空配列のまま保持し、`/reforge-plan` 以降で AI が推奨値を提案する（ユーザーは再度確認できる）。

### 質問選択肢の供給源

`single_choice` / `multi_choice` / `confirm` 型の質問を AskUserQuestion または questions.md で提示する際、選択肢は以下の優先順位で決定する:

1. **Question Entry の `options` フィールド**（最優先）: pending question に `options: string[]` が設定されていればそのまま使う。これが正準。
2. **SKILL.md のテンプレ表**（フォールバック1）: SKILL.md 内に推奨選択肢が表組みされている場合（例: reforge-init の Tech Field Question Generation の表）はそれを使う。
3. **デフォルトフォールバック**（最低限保証）: 上記いずれも無い場合、最低限「その他（自由記述）」と「分からない・AI におまかせ」の 2 択を含めて提示する。

> 制約: 選択肢を AI が裁量で推測補完してはならない（`no_guessing`）。`options` 未指定で SKILL.md テンプレ表も無い場合は、デフォルトフォールバックの 2 択のみを提示するか、質問エントリを修正して `options` を追加する。

### コマンド表記の統一

- スラッシュコマンドは **必ずハイフン形式** で表記する: `/reforge-init`、`/reforge-resume`、`/reforge-answer`、`/reforge-update`、`/reforge-render`、`/reforge-plan`、`/reforge-impl`、`/reforge-verify`、`/reforge-validate`、`/reforge-diff`。
- 旧コロン形式のスラッシュコマンド表記は使わない（reforge/CLAUDE.md と整合）。

## Canonical Paths

- `REFORGE_DIR = ".reforge"`
- `SPECS_DIR = ".reforge/specs"`
- `SPEC_PATH = ".reforge/specs/<name>/spec.json"` (resolved by Spec Resolution)
- `QUESTIONS_PATH = ".reforge/specs/<name>/questions.json"`

## Spec Resolution (reforge-answer [<spec-name>])

1. 引数で spec 名が渡された場合 → `.reforge/specs/<name>/` が存在すれば使用、なければエラー報告して `blocked`。
2. 引数なし + `.reforge/specs/` 内の spec が 1 つ → 自動選択して続行。
3. 引数なし + specs が複数 → 一覧表示して AskUserQuestion で選択を求める。
4. 引数なし + specs が 0 → `/reforge-init "<説明>"` を案内して `blocked`。

## Command Flow

最初に一致した条件で停止する。**フェーズルーティングは行わない。**

### ステップ 1: spec.json 存在チェック

`SPEC_PATH` が存在しない場合:
- ライフサイクルステージ `blocked` を報告する。
- 「`SPEC_PATH` が見つかりません。先に `/reforge-init "<説明>"` を実行してください。」と案内して終了する。

### ステップ 2: questions.json の pending チェック

`QUESTIONS_PATH` を読み取る。

- **`pending` が 1 件以上ある場合**:
  - 「質問機能プロトコル」Step 3 に従い `AskUserQuestion` で先頭 4 件をバッチ提示する（5件以上の場合も先頭 4 件のみ）。
  - ユーザーから回答を受け取ったらプロトコルの Step 5 / 6 に従い spec.json と questions.json を一括更新する。
  - 終了時の出力は **「残り質問 N 件」のみ**。次のコマンド推奨は出さない。
  - ライフサイクルステージ `answered` を報告して終了する。

- **`pending` が空の場合**:
  - ライフサイクルステージ `complete` を報告する。
  - 「未解決の質問はありません。次のフェーズコマンド（`/reforge-validate` / `/reforge-render` / `/reforge-plan` / `/reforge-impl` / `/reforge-verify`）を直接実行するか、ナビゲーターモードを使う場合は `/reforge-resume` を実行してください。」と案内して終了する。
  - **このスキルは次フェーズの判定をしない。** 何を実行すべきかはユーザー自身が判断する（マニュアルモードの設計意図）。

## 質問機能プロトコル

このスキルは以下のバッチ運用プロトコルに従って質問を処理します。全 reforge-engine コマンドで同一プロトコルを使用します。

### Step 1: 取得（pending の取得・新規生成）

`.reforge/specs/<name>/questions.json` の `pending` 配列を読み込み、AI-DLC phase 優先度（`meta → audience → intent → requirements → views → flows → data → tech → update`）に従って並べます。新規質問を生成する場合は以下の形式でエントリを追加します。

```json
{
  "id": "一意のスネークケース識別子",
  "phase": "meta | audience | intent | requirements | tech | data | views | flows | update のいずれか",
  "question": "ユーザー向けの質問文（meta.lang に従ってローカライズ）",
  "type": "text | single_choice | multi_choice | multi_input | confirm のいずれか",
  "resolves": ["spec.json 上の反映先 JSON パス（例: meta.audience, requirements, tech.frontend）"]
}
```

> **制約**: `id` は既存の `pending` および `answered` と重複してはならない。
> **制約**: `phase` は `meta`・`audience`・`intent`・`requirements`・`tech`・`data`・`views`・`flows`・`update` の 9 値のみ有効。

### Step 2: 提示モード判定

`pending` の件数に応じて以下を選択する:

| `pending` 件数 | 提示モード |
|---|---|
| 0 件 | 提示しない（`complete` を報告して終了） |
| 1〜4 件 | バッチ提示モード（`AskUserQuestion` で一括提示） |
| 5 件以上 | バッチ提示モード（先頭 4 件のみ `AskUserQuestion` で提示し、残りは次の `/reforge-resume` 実行で処理） |

### Step 3: 提示（バッチ・最大 4 問）

`AskUserQuestion` を **1 回だけ** 呼び出し、`questions` 配列に pending 先頭から最大 4 件を入れて一括提示する。pending が 5 件以上の場合も先頭 4 件のみを提示する。

選択型 (`single_choice` / `multi_choice` / `confirm`) は AskUserQuestion の選択肢として渡す。自由記述型 (`text` / `multi_input`) は AskUserQuestion の Other 経由で受け取る。

### Step 5: 反映（バッチ一括）

ユーザー回答（AskUserQuestion 結果）を解析し、各質問の `resolves` に列挙された JSON パスへ一括で反映する。

> **制約**: `resolves` に記載のないパスは変更しない（最小差分の原則）。
> **制約**: 推測による補完は禁止。回答が不十分な質問は反映をスキップし、その質問のみ pending に残す。

### Step 6: 移動（バッチ一括）

反映に成功した質問について、`questions.json` を以下のように更新する。

1. `pending` 配列から該当質問エントリを削除する。
2. `answered` 配列の末尾に同エントリを追加し `answer` フィールドを付与する（`answeredAt` は任意）。
3. すべての書き込みを 1 回のクオリティゲート実行のもとで一括実施する。

```json
// answered に移動後のエントリ例
{
  "id": "define_audience",
  "phase": "audience",
  "question": "このプロダクトの主なターゲットユーザーは誰ですか？（複数選択可）",
  "type": "multi_choice",
  "resolves": ["meta.audience"],
  "answer": "個人ユーザー, 開発者"
}
```

### 追加制約

- **AskUserQuestion 1 呼び出しの原則**: 1 スキル実行内で `AskUserQuestion` を呼ぶのは 1 回のみ（Step 3）。複数呼び出しは禁止。
- **共有ストレージ**: `.reforge/specs/<name>/questions.json` は全 reforge-engine コマンドの共有ストレージ。読み書きの前に必ず最新を読み込む。
- **推測での補完禁止**: 不明な spec フィールドは推測で埋めず、必ず質問を生成して `AskUserQuestion` を通じて確認する。

## Core Compliance Rules

- Never create a field with an unknown type.
- Never create `enum` without one or more explicit options.
- Never remove unrelated spec paths while applying an answer.
- Never infer additional fields from examples unless the user explicitly confirms them.
- Never write the same answer to multiple `resolves` paths beyond what the question declares.

## Completion Report

マニュアルモード Q&A の出力は最小限に保つ。出力する要素は以下のみ:

- ライフサイクルステージ: `answered`、`complete`、または `blocked` のいずれか。
- 反映先（書き込みがあった場合のみ）: `SPEC_PATH`、`QUESTIONS_PATH`。
- 残り pending 質問数。

**出力しないもの**:
- 進行マップ（`[✓]Init → [▶]Questions → ...` のような表示）
- NextAction
- 次フェーズの推奨コマンド

これらが必要な場合は `/reforge-resume` を使うのがマニュアルモードの設計上の住み分け。

### 出力例（バッチで回答反映後）

```
answered
反映先: spec.json (meta.audience, meta.intent), questions.json
残り質問: 2 件
```

### 出力例（pending が空のとき）

```
complete
未解決の質問はありません。
次のフェーズへは適切なフェーズコマンドを直接実行してください（マニュアルモード）。
```
