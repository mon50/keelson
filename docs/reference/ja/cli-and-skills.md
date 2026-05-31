# CLI とスキルのリファレンス

<sub>[← Keelson ドキュメント](../../README.md) · [English](../cli-and-skills.md) | 日本語</sub>

**対象読者:** Keelson の日常的な利用者。
**前提条件:** Keelson がインストール済み。
**到達点:** いつどのコマンドを使うかが分かる。

## CLI
- `npx keelson-cli install`: 正準スキルを `.keelson/system/skills` にコピーし、`.keelson/features` を初期化し、フォワーダーを `.claude/skills` または `.agents/skills` にインストールし、`.gitignore` に `.keelson/` がなければ追加します。既存の `.keelson/<feature>` ワークスペースは `.keelson/features/<feature>` に移行します。
- `npx keelson-cli doctor`: ワークスペースを検証します。
- `npx keelson-cli uninstall`: Keelson を削除します。

## スキル
- `/keel-discovery "<idea>"` — 入口: ラフな/大きな構想を小変更・単一/複数 feature に振り分ける
- `/keel-steering` — プロジェクト全体の steering（product / tech / principles）を作成・更新（feature 着手前に一度）
- `/keel-requirements "<idea>"` — `01-requirements/requirements.md` を作成・改訂し、`manifest.json` を初期化し、`audit.md` を作成する
- `/keel-us` — `02-user-stories/user-stories.md` と `02-user-stories/us-mock.html` を作成する
- `/keel-design` — 承認済みの requirements と stories から `03-design/design.md` を作成する
- `/keel-proto` — レビュー用の `04-prototype/prototype.html`（簡易プロトタイプ）を作成する
- `/keel-plan` — 承認済みアーティファクトから `05-plan/plan.md` を作成する
- `/keel-impl [task-id]` — 承認済みタスクを 1 つ実装する
- `/keel-verify` — 実装を承認済みアーティファクトと照合し、ギャップを報告する
- `/keel-quick "<change>"` — 小さな変更・バグ修正の軽量トラック（1スキルで完結）
- `/keel-status` — 現在のフェーズを報告し、次のコマンドを案内する（読み取り専用）

各スキルは制御をユーザーに返す前に、`.keelson/features/<feature>/audit.md` に追記し、その `Resume Point` を更新します。
