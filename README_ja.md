# Keelson

<div align="center">

[English](README.md) | **日本語**

[![npm](https://img.shields.io/npm/v/keelson-cli)](https://www.npmjs.com/package/keelson-cli)
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
- **唯一の真実。** `.keelson/features/<feature>/` の承認済み artifact bundle が仕様そのもの。単一 JSON でもチャット履歴でもない。
- **ドリフトせず、推測しない。** 未解決の疑問は所有する artifact に書き込み、明示的に解消する。仮定で埋めない。
- **不一致は発生源へ戻す。** 後続フェーズで問題が出たら、その場しのぎではなく問題を所有する artifact へ差し戻す。

## クイックスタート

```bash
cd your-project
npx keelson-cli install
```

Claude Code または Codex の中で、まずフロントドアを叩きます。

```text
/keel-discovery "既存の SaaS にチーム招待機能を追加したい"
```

`/keel-discovery` はアイデアを明確化し、次の 3 トラックのいずれかに振り分けます。

- **小さな変更やバグ修正** → `/keel-quick`
- **単一機能** → 以下のフルフロー
- **複数機能** → 1 機能ずつフルフローを順番に

discovery が単一機能に振り分けたあとのフルフローは次のとおりです。

```text
/keel-requirements "<feature>"
/keel-us
/keel-design
/keel-proto
/keel-plan
/keel-impl
```

すでに作業の形が自分で分かっている場合は、discovery を飛ばして `/keel-quick "<change>"` または `/keel-requirements "<feature>"` を直接呼び出しても構いません。

## クイック or フル?

`/keel-discovery` はこのチェックリストでトラックを選びます。同じ表を使って、自分の作業がどちらに振り分けられるか事前に確認できます。

| 質問 | YES → | NO → |
|---|---|---|
| 新しい UI surface（ページ・画面・主要 UI 領域）を追加するか? | フルフロー | quick の候補に残る |
| 新しいユーザー操作（新しい `US-XXX` 相当）が生じるか? | フルフロー | quick の候補に残る |
| 製品上の曖昧さ（未決定の意思決定）が残っているか? | フルフロー | quick の候補に残る |
| 影響範囲が単一機能を超えるか? | 複数機能（`/keel-discovery` で分解） | 単一機能 |

UI / 操作 / 曖昧さの3問すべてが NO で、範囲が単一機能に収まれば `/keel-quick` に振り分け。3問のいずれかが YES なら `/keel-requirements` に振り分けます。判定ルールの正本は [`keel-discovery`](.claude/skills/keel-discovery/SKILL.md) にあり、この表は読みやすさのための写しです。

## コマンド一覧

| コマンド | トラック / 役割 | 目的 |
|---|---|---|
| `/keel-steering` | 任意セットアップ | プロジェクト全体の steering を 1 リポジトリ 1 回作成 |
| `/keel-discovery "<idea>"` | **エントリ（フロントドア）** | アイデアを明確化し、quick / 単一機能 / 複数機能に振り分け |
| `/keel-quick "<change>"` | クイックトラック | 小さな変更やバグ修正を 1 スキルで完結 |
| `/keel-requirements "<feature>"` | フルトラック | 要件 |
| `/keel-us` | フルトラック | User Stories と US mock (`us` = user-stories) |
| `/keel-design` | フルトラック | 実装設計 |
| `/keel-proto` | フルトラック | 簡易プロトタイプ (`proto` = prototype) |
| `/keel-plan` | フルトラック | 実装プラン |
| `/keel-impl [task-id]` | フルトラック | 承認済みタスクを 1 つ実装 (`impl` = implement) |
| `/keel-verify` | ゲート | 実装と承認済み artifact の整合監査 |
| `/keel-status` | いつでも | 現在のフェーズと次コマンドを read-only で報告 |

## ワークフロー

以下のアーティファクト表は、`/keel-discovery` が単一機能に振り分けたあとに走るフルフローです。小さな変更の場合、`/keel-discovery` は代わりに `/keel-quick` に振り分けます。

| フェーズ | コマンド | 成果物 |
|---|---|---|
| Requirements | `/keel-requirements "<作りたい体験や機能>"` | `01-requirements/requirements.md`, `manifest.json`, `audit.md` |
| User Stories | `/keel-us` | `02-user-stories/user-stories.md`, `02-user-stories/us-mock.html` |
| Design | `/keel-design` | `03-design/design.md` |
| Prototype | `/keel-proto` | `04-prototype/prototype.html` |
| Plan | `/keel-plan` | `05-plan/plan.md` |
| Implement | `/keel-impl [task-id]` | コード変更と `05-plan/plan.md` の実装メモ |
| Verify | `/keel-verify` | `verify-report.md` |

各フェーズに承認ゲートがあります。後続フェーズで不一致が見つかった場合は、問題を所有する前段に戻します。

- 体験が違う → `/keel-us`
- Design とプロトがずれる → `/keel-design`
- 要求が曖昧 → `/keel-requirements`
- 実装中に仕様不足 → 該当する前段へ戻る

## 詰まったときは

フェーズがブロックされたり、後続フェーズで不一致が見つかったときは、Keelson はギャップを所有するフェーズへ戻します。その場しのぎで AI に穴埋めさせません。最頻パターン 3 つ:

- **「X is not approved」でブロックされる** → `X` を所有するフェーズを実行（例: `requirements` が未承認なら `/keel-requirements`）。
- **プロトタイプの体験が違う** → `/keel-us`。**プロトタイプが design と矛盾する** → `/keel-design`。
- **どのフェーズにいるか分からない** → `/keel-status`（read-only）。

ブロック条件と不一致の戻し先の全表は [トラブルシューティング — ブロック条件と戻り先](docs/reference/ja/troubleshooting.md) を参照してください。

## Source of Truth

唯一の真実は、承認済みの artifact bundle です。

```text
.keelson/
  system/
    skills/                            (プロジェクトローカルの正準スキル)
  discovery.md                       (workspace-wide, optional)
  steering/                          (workspace-wide, optional)
    product.md
    tech.md
    principles.md
  features/
    <feature>/
      manifest.json                    索引: パス・フェーズ状態・ダイジェスト
      audit.md                         継続ログ + Resume Point
      verify-report.md                 監査結果（/keel-verify 後）
      01-requirements/requirements.md
      02-user-stories/user-stories.md
      02-user-stories/us-mock.html
      03-design/design.md
      04-prototype/prototype.html
      04-prototype/prototype-notes.md  (optional)
      05-plan/plan.md
```

フェーズ所有のファイルは番号付き子ディレクトリに格納し、各フェーズが添付物（スクリーンショット・ノート・参考資料）をその直下にまとめられるようにしています。ワークスペース全体に対するファイル — `manifest.json`・`audit.md`・`verify-report.md` — はフィーチャー直下に置きます。

`/keel-quick` で扱う小さな変更の場合、フィーチャーワークスペースはフラットのままで、直下に `change.md` 1 ファイルだけが置かれます。

`manifest.json` は索引にすぎません。仕様本体は承認済みの Markdown / HTML artifact です。`audit.md` は継続ログで、ユーザー入力・意思決定・artifact 変更・検証結果と、次セッションの開始位置を示す `Resume Point` を記録します。

## 対応エージェント

| エージェント | コマンド接頭辞 | 状態 |
|---|---|---|
| Claude Code | `/keel-*` | ✅ 対応 |
| Codex | `/keel-*` | ✅ 対応 |

`npx keelson-cli install` は `.claude/` と `.agents/` を検出し、存在する環境にスキルを配置します。

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
