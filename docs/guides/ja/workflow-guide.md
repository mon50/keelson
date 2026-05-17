# Keelson ワークフローガイド

Keelson は artifact-first の AI-DLC Inception ワークフローです。旧 `spec.json` ライフサイクルは使いません。

## フェーズ

1. `/keel-requirements "<作りたい体験や機能>"` で UI デザイン期待値を含む `requirements.md`, `manifest.json`, `audit.md` を作成
2. `/keel-us` で `user-stories.md` と `us-mock.html` を作成
3. `/keel-design` で既存実装を踏まえた `design.md` を作成
4. `/keel-proto` で体験検証用の `prototype.html` を作成
5. `/keel-plan` で `plan.md` を作成
6. `/keel-impl [task-id]` で 1 task ずつ実装

## 成果物

```text
.keelson/<feature>/
  manifest.json
  audit.md
  requirements.md
  user-stories.md
  us-mock.html
  design.md
  prototype.html
  plan.md
```

`manifest.json` は状態と digest の索引です。SSoT は承認済み Markdown / HTML artifact です。`audit.md` はセッション履歴と次回開始位置を示す `Resume Point` を記録します。

## セッション継続

再開時は最初に `.keelson/<feature>/audit.md` を読み、`Resume Point` に書かれた artifact を読み込みます。古い workspace に `audit.md` がない場合は、`manifest.json` と現在の artifact から作成してから進めます。
