---
name: reforge-answer
description: マニュアルモード用の Q&A 専用スキル。pending な質問を1件提示して回答を spec.json に反映する。フェーズマップや NextAction は出さない。
allowed-tools: Read, Write, Edit, Glob, AskUserQuestion
---

# reforge-answer

## Core Rule

- Think in English, respond to the user in the language specified by `meta.lang`.
- Treat `.reforge/spec.json` as the single source of truth for the product specification.
- このスキルは **質問の提示と回答記録のみ** を行う。フェーズマップ、NextAction、次フェーズの案内は出力しない。
- ライフサイクルナビゲーションが必要な場合は `/reforge-resume` を使用する（ナビゲーターモード）。
- `/reforge-answer` はマニュアルモードでの Q&A 専用エンドポイント。
- Ask at most one user-facing question per run.
- Keep the skill self-contained. Do not require external prompt files.

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
  - `pending[0]` を `AskUserQuestion` で提示する。
  - ユーザーから回答を受け取ったら「回答の反映」セクションの手順で spec.json と questions.json を更新する。
  - 終了時の出力は **「残り質問 N 件」のみ**。次のコマンド推奨は出さない。
  - ライフサイクルステージ `answered` を報告して終了する。

- **`pending` が空の場合**:
  - ライフサイクルステージ `complete` を報告する。
  - 「未解決の質問はありません。次のフェーズコマンド（`/reforge-validate` / `/reforge-render` / `/reforge-plan` / `/reforge-impl` / `/reforge-verify`）を直接実行するか、ナビゲーターモードを使う場合は `/reforge-resume` を実行してください。」と案内して終了する。
  - **このスキルは次フェーズの判定をしない。** 何を実行すべきかはユーザー自身が判断する（マニュアルモードの設計意図）。

## 質問機能プロトコル

### Step 1: 取得

`QUESTIONS_PATH` の `pending` 配列から `pending[0]` を取得する。このスキルは新規質問を生成しない（spec の検査は行わない）。

### Step 2: 提示

取得した1問を `AskUserQuestion` で提示する。**1回の実行で提示する質問は必ず1問のみ。**

### Step 3: 反映

ユーザーから回答を受け取ったら、質問の `resolves` フィールドに列挙された全 JSON パスに対して回答を `SPEC_PATH` へ反映する。

> **制約**: `resolves` に記載のないパスは変更しない（最小差分の原則）。
> **制約**: 推測による補完は禁止。回答が不十分な場合は spec.json を変更せず、質問を `pending` に残す。

### Step 4: 移動

回答の反映が完了したら、`QUESTIONS_PATH` を更新する:

1. `pending` から該当質問を削除する。
2. `answered` の末尾に同エントリを追加し `answer` フィールドを付与する（`answeredAt` は任意）。
3. 書き込み前にクオリティゲートを実行する。

## Core Compliance Rules

- Never create a field with an unknown type.
- Never create `enum` without one or more explicit options.
- Never remove unrelated spec paths while applying an answer.
- Never infer additional fields from examples unless the user explicitly confirms them.

## Completion Report

マニュアルモード Q&A の出力は最小限に保つ。出力する要素は以下のみ:

- ライフサイクルステージ: `answered`、`complete`、または `blocked` のいずれか。
- 反映先（書き込みがあった場合のみ）: `SPEC_PATH` および `QUESTIONS_PATH`。
- 残り pending 質問数。

**出力しないもの**:
- 進行マップ（`[✓]Init → [▶]Questions → ...` のような表示）
- NextAction
- 次フェーズの推奨コマンド

これらが必要な場合は `/reforge-resume` を使うのがマニュアルモードの設計上の住み分け。

### 出力例（質問への回答後）

```
answered
反映先: spec.json (tech.frontend), questions.json
残り質問: 2 件
```

### 出力例（pending が空のとき）

```
complete
未解決の質問はありません。
次のフェーズへは適切なフェーズコマンドを直接実行してください（マニュアルモード）。
```
