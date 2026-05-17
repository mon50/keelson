# フェーズナビゲーション

<sub>[← Keelson ドキュメント](../../README.md) · [English](../status-vs-resume.md) | 日本語</sub>

**対象読者:** ワークフローを学習中のユーザー。
**症状:** 次に何をすべきか分からない。
**コマンド:** `.keelson/<feature>/audit.md` を開き、続けて `.keelson/<feature>/manifest.json` と `Resume Point` に挙げられたアーティファクトを読み込む。
**成功の合図:** エージェントがちょうど 1 フェーズ進むか、修正のために所有元フェーズへ戻る。
**よくある失敗:** 上流のアーティファクトがまだ `draft` または `needs_revision` のまま実装を続けようとする。

Keelson は明示的なフェーズコマンドを使います。

1. `/keel-requirements "<idea>"`
2. `/keel-us`
3. `/keel-design`
4. `/keel-proto`
5. `/keel-plan`
6. `/keel-impl [task-id]`

`manifest.json` はアーティファクトの状態を答えます。`audit.md` は過去セッションで何が起きたか、そして次にどこから再開するかを答えます。
