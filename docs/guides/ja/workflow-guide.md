# Keelson ワークフローガイド

<sub>[← Keelson Docs](../../README.md) · [English](../workflow-guide.md) | 日本語</sub>

Keelson は artifact-first の AI-DLC Inception ワークフローです。

## フェーズ

1. `/keel-requirements "<作りたい体験や機能>"` で UI デザイン期待値を含む `01-requirements/requirements.md` を作成（`manifest.json` と `audit.md` はフィーチャー直下）
2. `/keel-us` で `02-user-stories/user-stories.md` と `02-user-stories/us-mock.html` を作成
3. `/keel-design` で既存実装を踏まえた `03-design/design.md` を作成
4. `/keel-proto` で体験検証用の `04-prototype/prototype.html`（任意で `04-prototype/prototype-notes.md`）を作成
5. `/keel-plan` で `05-plan/plan.md` を作成
6. `/keel-impl [task-id]` で 1 task ずつ実装

## 成果物

```text
.keelson/features/<feature>/
  manifest.json
  audit.md
  verify-report.md                   (/keel-verify 後)
  01-requirements/requirements.md
  02-user-stories/user-stories.md
  02-user-stories/us-mock.html
  03-design/design.md
  04-prototype/prototype.html
  04-prototype/prototype-notes.md    (optional)
  05-plan/plan.md
```

フェーズ所有のファイルは番号付き子ディレクトリに格納し、添付物（スクリーンショット・ノート・参考資料）も同じ子ディレクトリの中にまとめます。ワークスペース全体に対するファイル — `manifest.json`・`audit.md`・`verify-report.md` — はフィーチャー直下に置きます。

`manifest.json` は状態と digest の索引です。SSoT は承認済み Markdown / HTML artifact です。`audit.md` はセッション履歴と次回開始位置を示す `Resume Point` を記録します。

`/keel-quick` で扱う小さな変更の場合、ワークスペースはフラットのままで、フィーチャー直下に `manifest.json`・`audit.md`・`change.md` が置かれます。

## セッション継続

再開時は最初に `.keelson/features/<feature>/audit.md` を読み、`Resume Point` に書かれた artifact を読み込みます。古い workspace に `audit.md` がない場合は、`manifest.json` と現在の artifact から作成してから進めます。
