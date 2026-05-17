# CLI とスキルのリファレンス

<sub>[← Keelson ドキュメント](../../README.md) · [English](../cli-and-skills.md) | 日本語</sub>

**対象読者:** Keelson の日常的な利用者。
**前提条件:** Keelson がインストール済み。
**到達点:** いつどのコマンドを使うかが分かる。

## CLI
- `npx keelson install`: 正準スキルを `.keelson/skills` にコピーし、フォワーダーを `.claude/skills` または `.agents/skills` にインストールし、`.gitignore` に `.keelson/` がなければ追加します。
- `npx keelson doctor`: ワークスペースを検証します。
- `npx keelson uninstall`: Keelson を削除します。

## スキル
- `/keel-requirements "<idea>"` — `requirements.md` を作成・改訂し、`manifest.json` を初期化し、`audit.md` を作成する
- `/keel-us` — `user-stories.md` と `us-mock.html` を作成する
- `/keel-design` — 承認済みの requirements と stories から実装デザインを作成する
- `/keel-proto` — レビュー用の簡易プロトタイプを作成する
- `/keel-plan` — 承認済みアーティファクトから `plan.md` を作成する
- `/keel-impl [task-id]` — 承認済みタスクを 1 つ実装する

各スキルは制御をユーザーに返す前に、`.keelson/<feature>/audit.md` に追記し、その `Resume Point` を更新します。
