---
name: reforge-render
description: Start a local HTML prototype server from .reforge/spec.json and run the approval flow that writes meta.approved to spec.json.
allowed-tools: Read, Bash, Write, AskUserQuestion
---

# reforge-render

## Core Rule

- Think in English, respond to the user in the language specified by `meta.lang`.
- Treat `.reforge/spec.json` as the single source of truth for the product specification.
- Do not invent missing product decisions.
- Keep the skill self-contained. Do not require external prompt files.

## Canonical Paths

- `REFORGE_DIR = ".reforge"`
- `SPECS_DIR = ".reforge/specs"`
- `SPEC_PATH = ".reforge/specs/<name>/spec.json"` (resolved by Spec Resolution)
- `QUESTIONS_PATH = ".reforge/specs/<name>/questions.json"`

## Spec Resolution (reforge-render [<spec-name>])

1. 引数で spec 名が渡された場合 → `.reforge/specs/<name>/` が存在すれば使用、なければエラー報告して `blocked`。
2. 引数なし + `.reforge/specs/` 内の spec が 1 つ → 自動選択して続行。
3. 引数なし + specs が複数 → 一覧表示して AskUserQuestion で選択を求める。
4. 引数なし + specs が 0 → `/reforge-init "<説明>"` を案内して `blocked`。

選択された spec 名を `<name>` として Canonical Paths を解決する。

## Server Entry Point Resolution

When starting the server, resolve the entry point using this priority order:

1. **Installed project**: `node .reforge/server/index.js` — used when the project has installed Reforge via npm
2. **Source development**: `node reforge-renderer/dist/index.js` — used when running from the Reforge source repository
3. **Neither path exists**: Report the error and prompt the user to build:
   - 「サーバーエントリポイントが見つかりません。`cd reforge/reforge-renderer && npm run build` を実行してから再試行してください。」
   - Stop execution.

Use `Bash: test -f .reforge/server/index.js` and `Bash: test -f reforge-renderer/dist/index.js` to check which path exists before launching.

## Command Flow

Execute the following steps in order.

### ステップ 1: Spec Resolution と spec.json 存在確認・状態読み取り

まず Spec Resolution を実行して `<name>` と `SPEC_PATH` を確定する。

`Read SPEC_PATH` を実行する。

- **Spec Resolution で spec が見つからない場合**:
  - 「spec が見つかりません。`/reforge-init "<プロダクトの説明>"` を実行してください。」と表示して終了する。

- **ファイルが存在しない場合**:
  - 「`SPEC_PATH` が見つかりません。`/reforge-init "<プロダクトの説明>"` を実行してください。」と表示して終了する。

ファイルが存在する場合、`meta.lang` と `meta.approved` を読み取る。

### ステップ 2: questions.json 未解決警告（非ブロッキング）

`Read .reforge/questions.json` が存在すれば読み込む。

- `pending` 配列に1件以上のエントリがある場合:
  - サーバー起動前に警告を表示する:「未解決の質問が {件数} 件あります。`/reforge-resume` で解決してから承認することを推奨します。」
  - 警告後もサーバーの起動を続行する（ブロックしない）。

### ステップ 3: サーバーエントリポイントの解決と起動

Server Entry Point Resolution セクションの手順でエントリポイントを決定する。

エントリポイントが見つかった場合:
- `Bash: node <entry_point>` でサーバーを起動する（デフォルトポート 4317、または `--port <number>` で指定）。
- サーバーが出力するURLを確認し、ユーザーに表示する:「サーバーが起動しました: http://127.0.0.1:4317」
- ブラウザでURLを開いて仕様UIを確認するよう案内する。

### ステップ 4: meta.approved による分岐

**`meta.approved` が `true` の場合（プレビューのみ）**:
- 「この仕様はすでに承認済みです。プレビューのみ表示します。」と通知する。
- ユーザーが確認を終えたら `Bash: サーバー停止` を実行して終了する。
- 次のステップとして `/reforge-resume` を案内する。

**`meta.approved` が `false` または未設定の場合（承認フロー）**:
- `AskUserQuestion` を使って以下の質問を1回のみ提示する:
  - 「UIプロトタイプを確認しました。仕様を承認しますか？」
  - type: `confirm`
  - options: `["はい（承認する）", "いいえ（修正が必要）"]`

**ユーザーが承認した場合**:
1. `Read .reforge/spec.json` を再読み込みして最新の内容を取得する。
2. `meta.approved` を `true` に更新し、他のフィールドを保持して `Write .reforge/spec.json` で書き込む。
3. `Bash: サーバー停止` を実行してサーバーを終了する。
4. 次のステップを案内する:「承認が完了しました。`/reforge-plan` を実行してタスクキューを生成してください。」

**ユーザーが承認しなかった場合**:
1. `Bash: サーバー停止` を実行してサーバーを終了する。
2. 修正方法を案内する:「仕様を修正するには `/reforge-update "<変更内容>"` を実行してください。」

## Quality Gate

Before writing `spec.json`, verify:

- Written spec preserves all existing top-level keys (`meta`, `entities`, `views`, `flows`, `tech`).
- Only `meta.approved` is changed; no other fields are modified.
- `meta.name`, `meta.version` remain present and non-empty.

## Completion Report

Report concisely:

- Lifecycle stage: `preview_only`, `approved`, `rejected`, or `blocked`.
- Changed artifacts: `SPEC_PATH` (if approved), or `none`.
- Next gate:
  - If `approved`: `/reforge-plan` を実行する
  - If `rejected`: `/reforge-update "<変更内容>"` を実行する
  - If `preview_only`: `/reforge-resume` で現在の状態を確認する
  - If `blocked`: エラーを解消してから再実行する
