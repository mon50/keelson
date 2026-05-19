# CLI とスキルのリファレンス

<sub>[← Keelson ドキュメント](../../README.md) · [English](../cli-and-skills.md) | 日本語</sub>

**対象読者:** Keelson の日常的な利用者。
**前提条件:** Keelson がインストール済み。
**到達点:** いつどのコマンドを使うかが分かる。

## CLI
- `npx keelson-cli install`: 正準スキルを `.keelson/skills` にコピーし、フォワーダーを `.claude/skills` または `.agents/skills` にインストールし、`.gitignore` に `.keelson/` がなければ追加します。
- `npx keelson-cli doctor`: ワークスペースを検証します。
- `npx keelson-cli uninstall`: Keelson を削除します。

## スキル
- `/keel-discovery "<idea>"` — 入口: ラフな/大きな構想を小変更・単一/複数 feature に振り分ける
- `/keel-steering` — プロジェクト全体の steering（product / tech / principles）を作成・更新（feature 着手前に一度）
- `/keel-requirements "<idea>"` — `requirements.md` を作成・改訂し、`manifest.json` を初期化し、`audit.md` を作成する
- `/keel-us` — `user-stories.md` と `us-mock.html` を作成する
- `/keel-design` — 承認済みの requirements と stories から実装デザインを作成する
- `/keel-proto` — レビュー用の簡易プロトタイプを作成する
- `/keel-plan` — 承認済みアーティファクトから `plan.md` を作成する
- `/keel-impl [task-id]` — 承認済みタスクを 1 つ実装する
- `/keel-verify` — 実装を承認済みアーティファクトと照合し、ギャップを報告する
- `/keel-quick "<change>"` — 小さな変更・バグ修正の軽量トラック（1スキルで完結）
- `/keel-status` — 現在のフェーズを報告し、次のコマンドを案内する（読み取り専用）

各スキルは制御をユーザーに返す前に、`.keelson/<feature>/audit.md` に追記し、その `Resume Point` を更新します。
