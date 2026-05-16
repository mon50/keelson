# Reforge ワークフローガイド

Reforge は artifact-first の AI-DLC Inception ワークフローです。旧 `spec.json` ライフサイクルは使いません。

## フェーズ

1. `/reforge-requirements "<作りたい体験や機能>"` で UI デザイン期待値を含む `requirements.md` を作成
2. `/reforge-us` で `user-stories.md` と `us-mock.html` を作成
3. `/reforge-design` で既存実装を踏まえた `design.md` を作成
4. `/reforge-proto` で体験検証用の `prototype.html` を作成
5. `/reforge-plan` で `plan.md` を作成
6. `/reforge-impl [task-id]` で 1 task ずつ実装

## 成果物

```text
.reforge/<feature>/
  manifest.json
  requirements.md
  user-stories.md
  us-mock.html
  design.md
  prototype.html
  plan.md
```

`manifest.json` は状態と digest の索引です。SSoT は承認済み Markdown / HTML artifact です。
