# プランスキーマ

<sub>[← Keelson ドキュメント](../../README.md) · [English](../tasks-schema.md) | 日本語</sub>

実装タスクは `plan.md` に置きます。

各タスクには次を含めるべきです。

- 安定した ID（例: `T-001`）
- タイトル
- 由来となる requirement またはユーザーストーリー
- design への参照
- 変更する可能性の高いファイル
- 実装ステップ
- テストまたはチェック
- 受け入れ基準
- 依存関係

`/keel-impl [task-id]` はタスクを一度に 1 つ実装し、実装メモを `plan.md` に書き戻します。
