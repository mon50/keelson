# リカバリとロールバック

<sub>[← Keelson ドキュメント](../../README.md) · [English](../recovery-and-rollback.md) | 日本語</sub>

**症状:** アーティファクトが広くなりすぎた、別のアーティファクトと矛盾した、または早く承認しすぎた。
**コマンド:** 所有元のアーティファクトを編集するか、そのフェーズコマンドを再実行する。
**成功の合図:** `manifest.json` が修正済みアーティファクトを指し、必要に応じて後続アーティファクトが再生成されている。
**よくある失敗:** アーティファクト本文ではなく `manifest.json` を編集してしまう。

唯一の真実は、承認済みのアーティファクト束です。

- `01-requirements/requirements.md`
- `02-user-stories/user-stories.md`
- `02-user-stories/us-mock.html`
- `03-design/design.md`
- `04-prototype/prototype.html`
- `05-plan/plan.md`

ロールバックやアーティファクト再生成のあとは、理由と変更ファイルを `audit.md` に追記し、その `Resume Point` を正しい次のコマンドに更新します。

後続フェーズでプロダクトの不一致が判明したら `/keel-requirements` に戻ります。不一致が操作や UI モーメントなら `/keel-us` に戻ります。不一致が実装構造なら `/keel-design` に戻ります。
