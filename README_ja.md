# Reforge

Claude Code / Codex 向けの AI-DLC Inception とプロトタイプ収束ワークフローです。

Reforge はラフなプロダクト案を、承認済みの Requirements、User Stories、US モック、Design、簡易 Prototype、Implementation Plan に落とし込みます。その後の実装は cc-sdd に近い `/reforge-impl` で task 単位に進めます。

旧 `spec.json` / 質問キュー / entity CRUD 実装ワークフローとの後方互換性はありません。

## ワークフロー

| フェーズ | コマンド | 成果物 |
|---|---|---|
| Requirements | `/reforge-requirements "<作りたい体験や機能>"` | `requirements.md`, `manifest.json` |
| User Stories | `/reforge-us` | `user-stories.md`, `us-mock.md` |
| Design | `/reforge-design` | `design.md` |
| Prototype | `/reforge-proto` | `prototype.html` |
| Plan | `/reforge-plan` | `plan.md` |
| Implement | `/reforge-impl [task-id]` | コード変更と `plan.md` の実装メモ |

後続フェーズで不一致が見つかった場合は、問題を所有する前段に戻します。

- 体験が違う -> `/reforge-us`
- Design とプロトがずれる -> `/reforge-design`
- 要求が曖昧 -> `/reforge-requirements`
- 実装中に仕様不足 -> 該当する前段へ戻る

## Source Of Truth

SSoT は単一 JSON ではなく、承認済み artifact bundle です。

```text
.reforge/<feature>/
  manifest.json
  requirements.md
  user-stories.md
  us-mock.md
  design.md
  prototype.html
  plan.md
```

`manifest.json` は索引です。仕様本体は承認済み Markdown / HTML artifact です。
