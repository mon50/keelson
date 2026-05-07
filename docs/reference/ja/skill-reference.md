# Reforge スキルリファレンス

> 📖 **English reference:** [Skill Reference (English)](../skill-reference.md)

全 Reforge スキルと `.reforge/` ワークスペーススキーマの完全リファレンス。

## スキル一覧

| スキル | フェーズ | 説明 |
|---|---|---|
| [`reforge-init`](#reforge-init) | スペック | `spec.json` と質問キューを初期化する |
| [`reforge-resume`](#reforge-resume) | 全フェーズ¹ | ライフサイクルナビゲーター — どのフェーズでも次のアクションへ案内する |
| [`reforge-update`](#reforge-update) | 任意のフェーズ² | 自然言語の変更指示を spec に適用する |
| [`reforge-diff`](#reforge-diff) | 任意のフェーズ² | 直前のスナップショットとの JSON パス差分を表示する |
| [`reforge-validate`](#reforge-validate) | スペック | spec の完全性と整合性を確認する |
| [`reforge-render`](#reforge-render) | プロトタイプ | ローカルプロトタイプサーバーを起動する |
| [`reforge-plan`](#reforge-plan) | 計画 | 承認済み spec から `tasks.json` を生成する |
| [`reforge-impl`](#reforge-impl) | 実装 | エンティティを 1 つエンドツーエンドで実装する |
| [`reforge-verify`](#reforge-verify) | 検証 | 実装が spec と一致しているか確認する |

¹ **全フェーズ** — `reforge-resume` は最初の質問から最終検証まで、すべてのフェーズゲートを能動的にナビゲートする。  
² **任意のフェーズ** — メインのライフサイクルフローに影響なく、いつでも呼び出せるオプションのユーティリティ。

---

## スペックスキル

### `reforge-init`

自然言語のプロダクト説明から Reforge ワークスペースを初期化する。

**引数:** `"<プロダクトの説明>"` （必須）

**読み取り:** なし（初回実行時）。同じ名前の spec が既に存在する場合は上書き前に読み取る

**書き込み:**
- `.reforge/specs/<name>/spec.json` — 生成されたプロダクト仕様
- `.reforge/specs/<name>/questions.json` — 初期質問キュー

spec 名は説明から kebab-case スラッグとして自動導出される（例: `"フォトアルバム"` → `photo-albums`）。

**動作:**
- 説明から推測できる内容で `meta`, `tech`, `entities`, `views`, `flows` を埋める
- 回答できないプロダクトの意思決定はすべてペンディング質問に変換する
- 最後に 1 つだけ質問を提示して停止する
- enum オプション、フィールド名、ロール、承認ルールを証拠なく勝手に埋めない

**終了コード:** `files_written`, `question`, `blocked`, `complete`

**例:**
```
/reforge-init "現場スタッフ向けの日報アプリ、上長による承認フローあり"
```

---

### `reforge-resume`

ライフサイクル全体のナビゲーター。ワークスペースの現在状態を評価し、どのフェーズにいても次に取るべきアクションへ案内する。

**引数:** `[<spec-name>]`（任意 — spec が 1 つだけの場合は省略可）

**読み取り:** `.reforge/specs/<name>/spec.json`, `.reforge/specs/<name>/questions.json`, `.reforge/specs/<name>/tasks.json`

**書き込み:** `.reforge/specs/<name>/spec.json`, `.reforge/specs/<name>/questions.json` — 未解決質問への回答を記録するときのみ

**決定木（上から順に評価し、最初に一致した条件で停止）:**

| 条件 | 出力 |
|---|---|
| `spec.json` が存在しないまたは無効 | ブロック; `/reforge-init` を案内 |
| 未解決の質問がある | 最優先の質問を 1 つ提示し、返答で回答を記録する |
| 検証エラーあり | ブロック; `/reforge-validate` を案内 |
| `meta.approved` が false | ブロック; `/reforge-render` を案内 |
| `tasks.json` が存在しない | ブロック; `/reforge-plan` を案内 |
| pending/in_progress タスクあり | 最初の pending タスクの entity で `/reforge-impl <entity>` を案内 |
| 全タスク完了・verify 証跡なし | `/reforge-verify` を案内 |
| 全タスク完了・verify 完了 | プロジェクト完了を報告 |

**質問に回答するとき:**
- 回答を質問エントリの `resolves` に列挙されたパスのみに反映する
- 質問を `pending` から `answered` に移動する
- 同一実行内で次の質問は提示しない — 次の質問は再度 `/reforge-resume` を実行して取得する

**使用タイミング:** 次に何をすべきか分からないときや、中断後に再開するとき。どのフェーズでも安全に実行できる — 質問への回答記録以外では状態を変更しない。

---

### `reforge-update`

`spec.json` に自然言語の変更指示を適用する。

**引数:** `[<spec-name>]`（任意）、`"<変更内容>"`（必須）

**読み取り:** `.reforge/specs/<name>/spec.json`, `.reforge/specs/<name>/questions.json`

**書き込み:**
- `.reforge/specs/<name>/spec.json` — 対象パスのみを更新
- `.reforge/specs/<name>/spec.previous.json` — 変更前の spec のスナップショット
- `.reforge/specs/<name>/questions.json` — 変更が新たな曖昧性を導入した場合、新しい質問を追加することがある

**動作:**
- 変更指示に影響されるパスのみを修正する
- 影響を受けないフィールドとセクションをすべて保持する
- spec が承認済みだった場合、`meta.approved = false` を設定する
- 指示の曖昧な側面は推測せずにペンディング質問に変換する

**例:**
```
/reforge-update "月次サマリービューに PDF エクスポートオプションを追加する"
```

---

### `reforge-diff`

直前の spec スナップショットと現在の spec との差分を表示する。

**引数:** `[<spec-name>]`（任意 — spec が 1 つだけの場合は省略可）

**読み取り:** `.reforge/specs/<name>/spec.json`, `.reforge/specs/<name>/spec.previous.json`

**書き込み:** なし

**出力:** 追加・変更・削除されたパスの一覧（JSON パス形式）と未解決質問数。

**使用タイミング:** `reforge-update` の実行後、次のフェーズへ進む前。

---

### `reforge-validate`

`spec.json` の完全性と内部整合性を検証する。

**引数:** `[<spec-name>]`（任意 — spec が 1 つだけの場合は省略可）

**読み取り:** `.reforge/specs/<name>/spec.json`, `.reforge/specs/<name>/questions.json`（任意）

**書き込み:** なし

**確認内容:**
- 必須の `meta` フィールドと `tech` フィールドがすべて存在する
- すべての `views` エントリが `entities` に存在するエンティティを参照している
- すべての `flows` エントリに少なくとも 1 つのステップがある
- enum フィールドに `options` が定義されている
- 値がまだ提供されていないフィールドに `required` フラグが設定されていない

**結果:** 問題をすべて 1 回のパスでまとめて報告する（最初のエラーで停止しない）。クリーンな検証は `reforge-plan` の前提条件。

---

## プロトタイプスキル

### `reforge-render`

ローカル HTML プロトタイプサーバーを起動して人間がレビュー・承認する。

**引数:** `[<spec-name>]`（任意 — spec が 1 つだけの場合は省略可）

**読み取り:** `.reforge/specs/<name>/spec.json`

**書き込み:** ブラウザで承認したときに `spec.json` → `meta.approved = true` を設定

プロトタイプは `spec.json` の `views` に基づいて各エンティティをフォームまたは一覧として表示する。ページ下部の **Approve** ボタンをクリックすると承認が完了する。

**動作:**
- `node .reforge/server/index.js` でレンダラーサーバーを起動する
- ローカル URL を表示してプロセスを維持する
- プロトタイプは `spec.json` の現在の `entities`, `views`, `flows` を反映する
- ブラウザでの承認が `reforge-plan` のアンロック条件

**前提条件:** `spec.json` が存在して有効であること。不明な場合は先に `reforge-validate` を実行する。

---

## 計画スキル

### `reforge-plan`

承認済み spec から実装タスクキューを生成する。

**引数:** `[<spec-name>]`（任意 — spec が 1 つだけの場合は省略可）

**読み取り:** `.reforge/specs/<name>/spec.json`

**書き込み:** `.reforge/specs/<name>/tasks.json`

**ブロック条件:** `meta.approved` が `false` または存在しない場合 — 先に `reforge-render` で承認する。

**出力形式:**

```json
{
  "tasks": [
    {
      "id": "task-1",
      "entity": "EntityName",
      "status": "pending",
      "subtasks": ["db", "api", "ui", "test"]
    }
  ]
}
```

`spec.json` のエンティティごとに 1 つのタスクエントリが生成される。`subtasks` 配列は常に `["db", "api", "ui", "test"]`。

---

## 実装スキル

### `reforge-impl`

承認済み spec の 1 エンティティをエンドツーエンドで実装する。

**引数:** `[<spec-name>]`（任意）、`[<entity>]`（任意 — 省略時は `tasks.json` の最初の `pending` タスクを選択）

**読み取り:** `.reforge/specs/<name>/spec.json`, `.reforge/specs/<name>/tasks.json`

**書き込み:** 実装ファイル（スキーマ、ルート、コンポーネント、テスト）＋タスクの `status` を `done` に更新

**ブロック条件:**
- `spec.json` が存在しない → `reforge-init` を実行
- `meta.approved` が `true` でない → `reforge-render` を実行
- `tasks.json` が存在しない → `reforge-plan` を実行

**動作:**
- 対象エンティティを確定する（引数またはキューの先頭 pending タスク）
- `db`, `api`, `ui`, `test` の 4 層を 1 パスで生成する
- 完了後にタスクを `done` としてマークする
- 作成または変更したファイルを正確に報告する

**サブタスク層:**

| サブタスク | 生成内容 |
|---|---|
| `db` | データベースマイグレーションまたはスキーマファイル |
| `api` | ルートハンドラーとサービスレイヤー関数 |
| `ui` | ページコンポーネントとフォームコンポーネント |
| `test` | ユニットテストと結合テストファイル |

全タスクが `done` になるまで **繰り返し実行する**。

---

## 検証スキル

### `reforge-verify`

実装が承認済み spec と一致しているか確認する。読み取り専用。

**引数:** `[<spec-name>]`（任意 — spec が 1 つだけの場合は省略可）

**読み取り:** `.reforge/specs/<name>/spec.json`, `.reforge/specs/<name>/tasks.json`, 実装ファイル

**書き込み:** なし

**確認内容:**
- `spec.json` のすべてのエンティティに対応する実装ファイルが存在する
- `entities` で宣言されたすべてのフィールドが生成コードに含まれている
- `tasks.json` のすべてのタスクが `status: "done"` になっている

**出力:** エンティティごとの合否レポート。`meta.approved` の状態に関わらず実行できる — 情報確認目的でいつでも使用可能。

---

## ワークスペーススキーマ

各 spec は `.reforge/specs/<name>/` 以下に格納される。`<name>` は init 時に `meta.name` から自動導出された kebab-case スラッグ（例: `"フォトアルバム"` → `photo-albums`）。

### `.reforge/specs/<name>/spec.json`

プロダクト仕様の Single Source of Truth。すべての Reforge スキルはアクション前にこのファイルを読み取る。

```jsonc
{
  "meta": {
    "name": "string",       // プロダクト名
    "version": "string",    // spec バージョン
    "lang": "string",       // 応答言語（例: "ja", "en"）
    "approved": false       // reforge-render で人間が承認したとき true に設定される
  },
  "tech": {
    "frontend": "string",   // 例: "Next.js"
    "backend": "string",    // 例: "Node.js / Express"
    "database": "string",   // 例: "PostgreSQL"
    "orm": "string",        // 例: "Prisma"
    "styling": "string",    // 例: "Tailwind CSS"
    "testing": "string"     // 例: "Vitest"
  },
  "entities": {
    "EntityName": {
      "fields": {
        "fieldName": {
          "type": "string | number | date | enum | text | boolean",
          "required": true,
          "options": ["a", "b"]  // type が "enum" の場合に必須
        }
      }
    }
  },
  "views": {
    "ViewName": {
      "type": "string",       // 例: "list", "form", "detail"
      "entity": "EntityName", // entities に存在するエンティティを参照する必要あり
      "fields": ["fieldName"] // エンティティフィールドの任意サブセット
    }
  },
  "flows": {
    "FlowName": {
      "steps": ["ステップ 1", "ステップ 2"]
    }
  }
}
```

### `.reforge/specs/<name>/questions.json`

全スペックスキルが共有する質問キュー。

```jsonc
{
  "pending": [
    {
      "id": "q-1",
      "phase": "meta | tech | data | views | flows",
      "question": "アプリの認証方式は何にしますか？",
      "type": "string",
      "resolves": ["tech.auth"]  // 回答が埋める JSON パス
    }
  ],
  "answered": [
    {
      "id": "q-0",
      "phase": "meta",
      "question": "このプロダクトの名前は何ですか？",
      "type": "string",
      "resolves": ["meta.name"],
      "answer": "DailyReport"
    }
  ]
}
```

### `.reforge/specs/<name>/tasks.json`

`reforge-plan` が書き出し、`reforge-impl` が消化する実装タスクキュー。

```jsonc
{
  "tasks": [
    {
      "id": "task-1",
      "entity": "EntityName",
      "status": "pending | in_progress | done",
      "subtasks": ["db", "api", "ui", "test"]
    }
  ]
}
```

### `.reforge/specs/<name>/spec.previous.json`

直近の `reforge-update` 実行前の `spec.json` スナップショット。`reforge-diff` で使用する。`reforge-update` と `reforge-init` 以外のスキルは書き込まない。

> **初回実行時:** 新しいワークスペースではこのファイルは存在しない。最初の `reforge-update`（または `reforge-init` の上書き）が作成するまで、`/reforge-diff` は「前のスナップショットがありません」と報告する。

---

## 全スキル共通の制約

- **推測しない。** スキルは説明や事前の回答に証拠がなければ、フィールド名・enum 値・ロール・承認ルール・技術選定を勝手に埋めない。
- **1 回に 1 質問。** スキルは 1 回の実行でユーザー向けの質問を最大 1 つだけ提示する。
- **スキーマ準拠。** すべての書き込みは `spec.json` の `meta`, `tech`, `entities`, `views`, `flows` 構造と `questions.json` の `pending`, `answered` 構造を保持する。
- **言語の一貫性。** 説明と質問は `meta.lang` に従う。ファイルパス・JSON キー・ステータスマーカー・スキル名は常にリテラルのまま。
- **標準パス。** 上記の `.reforge/` パスを変更・移動してはならない。
