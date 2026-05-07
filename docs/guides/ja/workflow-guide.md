# Reforge ワークフローガイド

> 📖 **English guide:** [Workflow Guide (English)](../workflow-guide.md)

このガイドでは、最初のプロダクトアイデアから検証済み実装まで、Reforge ライフサイクルを順を追って説明する。各フェーズは人間のレビューによってゲートされており、Reforge がプロダクトの意思決定を勝手に行うことはない。

## 全体像

`reforge-init` の後は、1 つのコマンドだけでライフサイクル全体を完走できる:

```
reforge-init "説明"   # 1 回だけ
reforge-resume        # 完了まで繰り返す
```

`reforge-resume` はライフサイクルナビゲーターである。実行のたびにワークスペースの現在状態を読み取り、適切なアクションへ案内する — 全フェーズにわたって。

各フェーズを個別に呼び出したい場合のシーケンスは以下の通り:

```
フェーズ 1 — スペック      reforge-init → reforge-resume で質問に回答 → reforge-validate
フェーズ 2 — プロトタイプ  reforge-render → 人間が承認
フェーズ 3 — 計画          reforge-plan
フェーズ 4 — 実装          reforge-impl（1 回に 1 エンティティ）
フェーズ 5 — 検証          reforge-verify
```

任意のタイミングで使用可能: spec を修正する `reforge-update`、変更をレビューする `reforge-diff`。

---

## 用語解説

| 用語 | 意味 |
|---|---|
| **エンティティ (Entity)** | アプリが管理するコアデータオブジェクト。例: `DailyReport`、`User`。エンティティはデータベーステーブルと API リソースに対応する。 |
| **ビュー (View)** | エンティティを表示・編集する UI 画面。例: 一覧ビュー、フォーム、詳細ページ。 |
| **フロー (Flow)** | 複数のビューをまたぐ多段階のユーザー操作手順。例: 「日報を提出 → 上長がレビュー → 承認」。 |
| **スペック (Spec)** | `spec.json` ファイル: 1 つの機能・イニシアティブに関するすべてのプロダクト決定の Single Source of Truth。 |
| **Agent Skill** | `npx reforge install` によってインストールされるプレーンテキストの指示ファイル。AI エージェントが各ライフサイクルコマンドを実行する方法を定義する。 |

---

## フェーズ 1 — スペック

### ステップ 1: 初期化

```
/reforge-init "現場スタッフ向けの日報アプリを作りたい"
```

`reforge-init` は説明を読み取り、以下を生成する。

- `.reforge/specs/daily-report/spec.json` — `meta`, `tech`, `entities`, `views`, `flows` セクションを持つプロダクト仕様
- `.reforge/specs/daily-report/questions.json` — 推測できなかった詳細についての未解決質問キュー

spec 名（`daily-report`）は説明から kebab-case スラッグとして自動導出される。その後、優先度の最も高い質問を 1 つ提示して停止する。

**典型的な spec では 8〜15 問の質問が生成される。** 最初の 6 問は常に tech スタックの質問（`frontend`, `backend`, `database`, `orm`, `styling`, `testing`）で、説明に記述がある場合はスキップされる。その後にエンティティ・ビュー・フローの質問が続く。

**出力例:**

```
Created: .reforge/specs/daily-report/spec.json
Created: .reforge/specs/daily-report/questions.json

未解決の質問 (1 / 11):
  フロントエンドフレームワークは何を使いますか？
  (例: Next.js, Vite + React, Nuxt)
```

### ステップ 2: 質問に回答する（＋全フェーズのナビゲーション）

```
/reforge-resume
```

`reforge-resume` はライフサイクル全体のナビゲーターである。実行のたびにワークスペースの現在状態を読み取り、次に取るべきアクションを案内する — 質問フェーズだけでなく、すべてのフェーズゲートをカバーする。

評価する決定木（上から順に評価し、最初に一致した条件で停止）:

| 状態 | アクション |
|---|---|
| `spec.json` が存在しない | `/reforge-init` を案内 |
| 未解決の質問がある | 最優先の質問を 1 つ提示して回答を記録する |
| 検証エラーあり | `/reforge-validate` を案内 |
| `meta.approved` が false | `/reforge-render` を案内 |
| `tasks.json` が存在しない | `/reforge-plan` を案内 |
| pending/in_progress タスクあり | `/reforge-impl <entity>` を案内 |
| 全タスク完了・verify 未実施 | `/reforge-verify` を案内 |
| 全完了 | プロジェクト完了を報告 |

**1 回の実行で 1 アクション。** 各実行では質問の提示・回答の記録・次ステップの案内のいずれか 1 つだけを行って停止する。質問に回答した後は再度 `/reforge-resume` を実行して次の質問を取得する — ペースを自分でコントロールできるよう、手動再実行が設計上の意図。

**プロトタイプステップでの一時停止。** ナビゲーターが `reforge-render` フェーズに達すると、`/reforge-render` を実行してブラウザ URL を開くよう案内する。ライフサイクルはブラウザで **Approve** をクリックするまでここで一時停止する。承認後は `/reforge-resume` を再実行するとナビゲーターが次フェーズへ進む。

**質問が終わるタイミング:** `reforge-resume` が `complete: no pending questions` を報告して `/reforge-validate` を案内したら、ステップ 3 へ進む。ナビゲーターモードでは `reforge-resume` が自動で案内するため、自分で `/reforge-validate` を叩く必要はない。

> **ヒント:** ワークフローのどこにいるか分からなくなったら、`/reforge-resume` が常に次のステップを教えてくれる。

### ステップ 3: 検証

> ナビゲーターモードでは、すべての質問が完了した後に `/reforge-resume` が自動でここへ案内する。マニュアルモードでは自分でこのコマンドを実行する。

```
/reforge-validate
```

`reforge-validate` は `spec.json` について以下を確認する。

- 必須フィールドの欠落
- `options` に含まれない enum 値
- 存在しないエンティティを参照している view
- ステップのない flow

問題が見つかった場合、すべてを 1 回のパスでまとめて報告する。`reforge-update` で spec を修正してクリーンになるまで再実行する。ナビゲーターモードでは、検証が成功すると次の `/reforge-resume` 実行でプロトタイプフェーズへ自動で進む。

### 任意: 更新と差分確認

```
/reforge-update "月次レポートの CSV エクスポート機能を追加する"
/reforge-diff
```

`reforge-update` は自然言語の変更指示をいつでも適用できる。影響のない spec パスはすべて保持する。`reforge-diff` で前後のスナップショット間の JSON パス差分を確認してから続行する。

> **注記:** `spec.previous.json` は最初の `reforge-update`（または `reforge-init` の上書き）で作成される。それ以前は `/reforge-diff` が「前のスナップショットがありません」と報告する。

---

## フェーズ 2 — プロトタイプ

### ステップ 4: UI プロトタイプを確認する

> ナビゲーターモードでは、検証が通った後に `/reforge-resume` が自動でここへ案内する。ライフサイクルはブラウザで承認するまでこのステップで一時停止する。

```
/reforge-render
```

`reforge-render` は `spec.json` からプロトタイプを描画するローカル Web サーバーを起動する。表示された URL をブラウザで開き、プロトタイプを確認して承認または却下する。

プロトタイプは `spec.json` の `views` に基づいて各エンティティをフォームまたは一覧として表示する。ページ下部の **Approve** ボタンをクリックすると `spec.json` に `meta.approved = true` が書き込まれ、`reforge-plan` がアンロックされる。承認後は `/reforge-resume` を実行して続行する。

**却下した場合:** `reforge-update` で spec を修正し、再検証してから再度 `/reforge-render` を実行する。

---

## フェーズ 3 — 計画

### ステップ 5: タスクキューを生成する

> ナビゲーターモードでは、プロトタイプ承認後に `/reforge-resume` が自動でここへ案内する。

```
/reforge-plan
```

`reforge-plan` は承認済みの `spec.json` を読み取り、`.reforge/specs/<name>/tasks.json` を書き出す。タスクキューの各エントリは 1 つのエンティティに対応し、必要なサブタスク（`db`, `api`, `ui`, `test`）を列挙する。

`meta.approved` が `true` でない場合、このステップはブロックされる。

**`tasks.json` の例:**

```json
{
  "tasks": [
    { "id": "task-1", "entity": "DailyReport", "status": "pending", "subtasks": ["db", "api", "ui", "test"] },
    { "id": "task-2", "entity": "User",        "status": "pending", "subtasks": ["db", "api", "ui", "test"] }
  ]
}
```

---

## フェーズ 4 — 実装

### ステップ 6: エンティティを 1 つずつ実装する

> ナビゲーターモードでは、タスクキューが生成された後に `/reforge-resume` が自動でここへ案内する。

```
/reforge-impl
```

引数なしの場合、`reforge-impl` は `tasks.json` から最初の `pending` タスクを選択し、エンドツーエンドで実装する: データベーススキーマ、API レイヤー、UI コンポーネント、テスト。完了後、タスクを `done` としてマークして生成内容を報告する。

特定のエンティティを実装する場合:

```
/reforge-impl DailyReport
```

全タスクが `done` になるまで `/reforge-impl` を繰り返す。

**`reforge-impl` がエンティティごとに生成するもの（Next.js + Prisma 構成の例）:**

| サブタスク | 生成内容 |
|---|---|
| `db` | `prisma/migrations/<timestamp>_daily_report.sql` |
| `api` | `src/app/api/daily-reports/route.ts` |
| `ui` | `src/app/daily-reports/page.tsx`、`src/components/DailyReportForm.tsx` |
| `test` | `src/app/api/daily-reports/route.test.ts`、`src/components/DailyReportForm.test.tsx` |

実際のパスは spec で指定した tech スタックに従う。

---

## フェーズ 5 — 検証

### ステップ 7: 実装を検証する

> ナビゲーターモードでは、すべてのタスクが完了した後に `/reforge-resume` が自動でここへ案内する。

```
/reforge-verify
```

`reforge-verify` は読み取り専用で、以下を確認する。

- `spec.json` のすべてのエンティティに対応する実装ファイルが存在するか
- `tasks.json` のすべてのタスクが `done` になっているか
- 生成されたファイルが spec で宣言されたフィールドを網羅しているか

エンティティごとの合否レポートを出力する。失敗したエンティティがある場合は、報告された実装ファイルを開いて指摘された問題を手動で修正し、すべてのエンティティが合格になるまで `/reforge-verify` を再実行する。

---

## よくあるパターン

### 中断後に再開する

すべての状態が `.reforge/` に格納されているため、常に前回の続きから再開できる。

- スペックフェーズ中: `/reforge-resume` を実行 — 現在の質問キューを読み取る。
- 実装フェーズ中: `/reforge-impl` を実行 — `tasks.json` を読み取り `done` タスクをスキップする。

### 承認後に spec を修正する

`meta.approved = true` の後に spec を変更する必要が生じた場合:

1. `/reforge-update "変更内容"` を実行 — これにより `meta.approved = false` が自動設定される。
2. `/reforge-validate` で spec の整合性を確認する。
3. `/reforge-render` を再実行して更新されたプロトタイプを再承認する。
4. `/reforge-plan` を実行して `tasks.json` を再生成する。

### 1 プロジェクトに複数の spec を持つ

機能やイニシアティブごとに `reforge-init` を実行する。それぞれ独自のディレクトリが作成される:

```
/reforge-init "日報アプリ"           # → .reforge/specs/daily-report/
/reforge-init "管理ダッシュボード"   # → .reforge/specs/admin-dashboard/
```

他のコマンド実行時は spec 名を指定する:

```
/reforge-resume daily-report          # daily-report をナビゲート
/reforge-impl admin-dashboard User    # admin-dashboard の User を実装
```

spec が 1 つだけの場合は名前の引数を省略できる。

### バージョン管理

`.reforge/` をコミットするとチームメンバーとスペックの進捗を共有できる。ワークスペース状態をローカルに留めたい場合は `.reforge/` を `.gitignore` に追加する。

---

## 次のステップ

- [スキルリファレンス](../../reference/ja/skill-reference.md) — スキルごとの入力・出力・制約
