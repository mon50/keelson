# Keelson

<div align="center">

[English](README.md) | **日本語**

[![npm](https://img.shields.io/npm/v/@keelson/cli)](https://www.npmjs.com/package/@keelson/cli)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

</div>

```text
   ╭───────────────────────────╮
   ╰─╮ │  │  │  │  │  │  │  │ ╭─╯
     ╰─┴──┴──┴──┴──┴──┴──┴──┴─╯
          K E E L S O N
```

> **Claude Code / Codex 向けの AI-DLC Inception とプロトタイプ収束ワークフロー。**
>
> キールソン（竜骨上の通し梁）が船体のフレームをまっすぐ締結するように、Keelson は実装を承認済み仕様どおりに保ちます。

Keelson はラフなプロダクト案を、承認済みの **Requirements → User Stories → US モック → Design → Prototype → Plan** に収束させ、その後の実装を Kiro 流の `/keel-impl` ループで task 単位に進めます。各フェーズに承認ゲートがあり、あなたが下した判断より先に AI が進むことはありません。

## Keelson を使う理由

- **作る前に承認する。** 各フェーズは人による承認ゲートで終わる。実装は承認済み artifact のみを読む。
- **唯一の真実。** `.keelson/<feature>/` の承認済み artifact bundle が仕様そのもの。単一 JSON でもチャット履歴でもない。
- **ドリフトせず、推測しない。** 未解決の疑問は所有する artifact に書き込み、明示的に解消する。仮定で埋めない。
- **不一致は発生源へ戻す。** 後続フェーズで問題が出たら、その場しのぎではなく問題を所有する artifact へ差し戻す。

## クイックスタート

```bash
cd your-project
npx @keelson/cli install
```

Claude Code または Codex の中でワークフローを実行します。

```text
/keel-requirements "既存の SaaS にチーム招待機能を追加したい"
/keel-us
/keel-design
/keel-proto
/keel-plan
/keel-impl
```

## ワークフロー

| フェーズ | コマンド | 成果物 |
|---|---|---|
| Requirements | `/keel-requirements "<作りたい体験や機能>"` | `requirements.md`, `manifest.json`, `audit.md` |
| User Stories | `/keel-us` | `user-stories.md`, `us-mock.html` |
| Design | `/keel-design` | `design.md` |
| Prototype | `/keel-proto` | `prototype.html` |
| Plan | `/keel-plan` | `plan.md` |
| Implement | `/keel-impl [task-id]` | コード変更と `plan.md` の実装メモ |

各フェーズに承認ゲートがあります。後続フェーズで不一致が見つかった場合は、問題を所有する前段に戻します。

- 体験が違う → `/keel-us`
- Design とプロトがずれる → `/keel-design`
- 要求が曖昧 → `/keel-requirements`
- 実装中に仕様不足 → 該当する前段へ戻る

## Source of Truth

唯一の真実は、承認済みの artifact bundle です。

```text
.keelson/<feature>/
  manifest.json      索引: パス・フェーズ状態・ダイジェスト
  audit.md           継続ログ + Resume Point
  requirements.md
  user-stories.md
  us-mock.html
  design.md
  prototype.html
  plan.md
```

`manifest.json` は索引にすぎません。仕様本体は承認済みの Markdown / HTML artifact です。`audit.md` は継続ログで、ユーザー入力・意思決定・artifact 変更・検証結果と、次セッションの開始位置を示す `Resume Point` を記録します。

## 対応エージェント

| エージェント | コマンド接頭辞 | 状態 |
|---|---|---|
| Claude Code | `/keel-*` | ✅ 対応 |
| Codex | `/keel-*` | ✅ 対応 |

`npx @keelson/cli install` は `.claude/` と `.agents/` を検出し、存在する環境にスキルを配置します。

## 設計スタンス

Keelson は実装前の収束ループを担います。

- **Requirements** — WHAT / WHY に加え、ユーザーが期待する UI デザイン方針も明示する。
- **User Stories** — ユーザー操作と UI モーメントを確認する。
- **Design** — 既存実装とファイル境界に基づいて実装範囲を決める。
- **Prototype** — US の体験と Design の方向性が噛み合うか検証する。
- **Plan** — 実装タスクを作成する。

`/keel-impl` は Kiro 流のループです。1タスク、コード調査、テスト意図、実装、検証、メモ記録。

## ドキュメント

ガイド・リファレンス・解説を **英語と日本語**で提供しています。

- 📖 **[ドキュメント索引](docs/README.md)** — 全ドキュメントの二言語ハブ
- 日本語 — [ワークフローガイド](docs/guides/ja/workflow-guide.md) · [スキルリファレンス](docs/reference/ja/skill-reference.md)
- English — [README (English)](README.md) · [Workflow Guide](docs/guides/workflow-guide.md) · [Skill Reference](docs/reference/skill-reference.md)

## ライセンス

[MIT](LICENSE)
