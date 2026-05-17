# Keelson

Claude Code / Codex 向けの AI-DLC Inception とプロトタイプ収束ワークフローです。

Keelson はラフなプロダクト案を、承認済みの Requirements、User Stories、US モック、Design、簡易 Prototype、Implementation Plan に落とし込みます。その後の実装は cc-sdd に近い `/keel-impl` で task 単位に進めます。

旧 `spec.json` / 質問キュー / entity CRUD 実装ワークフローとの後方互換性はありません。

## ワークフロー

| フェーズ | コマンド | 成果物 |
|---|---|---|
| Requirements | `/keel-requirements "<作りたい体験や機能>"` | `requirements.md`, `manifest.json`, `audit.md` |
| User Stories | `/keel-us` | `user-stories.md`, `us-mock.html` |
| Design | `/keel-design` | `design.md` |
| Prototype | `/keel-proto` | `prototype.html` |
| Plan | `/keel-plan` | `plan.md` |
| Implement | `/keel-impl [task-id]` | コード変更と `plan.md` の実装メモ |

後続フェーズで不一致が見つかった場合は、問題を所有する前段に戻します。

- 体験が違う -> `/keel-us`
- Design とプロトがずれる -> `/keel-design`
- 要求が曖昧 -> `/keel-requirements`
- 実装中に仕様不足 -> 該当する前段へ戻る

## Source Of Truth

SSoT は単一 JSON ではなく、承認済み artifact bundle です。

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

`manifest.json` は索引です。仕様本体は承認済み Markdown / HTML artifact です。`audit.md` は継続ログで、ユーザー入力、意思決定、artifact 変更、検証結果、次セッションの開始位置を示す `Resume Point` を記録します。

## Design Stance

- Requirements では WHAT / WHY に加えて、ユーザーが期待する UI デザイン方針も明示します。
- User Stories ではユーザー操作と UI モーメントを確認します。
- Design では既存実装とデザイン証拠に基づいて実装境界を決めます。
