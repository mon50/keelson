# Reforge

AI コーディングエージェントに、勝手な判断をさせない。

Reforge は Claude Code / Codex 向けの spec-first workflow です。曖昧な要望をそのまま実装に流さず、承認済み spec、ローカルプロトタイプ、実装タスク、検証ループに分解してからコード変更に進めます。

新規 MVP にも、既存リポジトリへの新機能追加にも使えます。不明点がある場合、Reforge は推測で埋めず、質問として人間に戻します。

[![npm version](https://img.shields.io/npm/v/aid-reforge?logo=npm)](https://www.npmjs.com/package/aid-reforge)
[![license: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

<div align="center"><sub>
README: <a href="./README.md">English</a> | 日本語
</sub></div>

## なぜ使うのか

AI コーディングは最初が速い。一方で、数回プロンプトを重ねると、プロダクト仕様、DB、API、UI、タスク、テストが少しずつズレ始めます。

Reforge は、実装前に人間の承認ゲートを置きます。

- 未決定事項を pending questions にする
- 回答を `.reforge/specs/<name>/spec.json` に残す
- ローカルプロトタイプを承認するまで実装計画に進まない
- `tasks.json` に従って entity 単位で実装する
- 実装後に spec との差分を検証する

目的は AI をより自律させることではありません。要件、ロール、状態、フィールド、既存リポジトリの境界を AI が黙って決めないようにすることです。

## 想定ユースケース

| ユースケース | Reforge が狙う痛み |
|---|---|
| **新規 MVP** | Claude Code / Codex にアプリを作らせる前に、認証、権限、状態、画面、データルールを固めたい。 |
| **既存 repo の新機能** | 既存スタック、命名規則、責務境界、テスト、触ってはいけない領域を無視した AI 実装を避けたい。 |

Brownfield support は機能単位です。Reforge は大規模リポジトリ全体を完全に reverse engineer したとは扱いません。軽量な repository context、変更範囲、編集可能領域、保護領域、受け入れ条件、リスクを spec に記録します。不明点は質問に残します。

## Before / After

**Before**

```
"日報アプリを作って"
```

AI が下書き、提出後編集、上長承認、管理画面、通知、DB フィールド、API 形状を勝手に決めて進む可能性があります。

**After**

Reforge は先に未決定事項を聞きます。

- 提出済みの日報は誰が読めるか
- 下書きは必要か
- 提出後に編集できるか
- report entity にどのフィールドが必要か
- MVP に必要な画面はどれか

回答は実装前に spec に残ります。

既存リポジトリでも同じです。

- どの機能を追加するのか
- 既存のどの領域を触ってよいか
- どの領域を触ってはいけないか
- 受け入れ条件は何か
- 既存のどの規約に合わせるべきか

## 仕組み

Reforge は **Skill-based Agent Framework** です。`npx aid-reforge install` を実行すると、正準 Skill が `.reforge/skills/` にコピーされ、Claude Code 用の `.claude/skills/` または Codex 用の `.agents/skills/` には軽量フォワーダーが入ります。ユーザーが呼ぶ `/reforge-*` コマンドは、プロジェクトローカルの Skill を読んで同じワークフロー契約に従います。

| フェーズ | Skill | 役割 |
|---|---|---|
| Spec | `/reforge-init` | 説明から `spec.json` と質問キューを生成する |
| 全フェーズ¹ | `/reforge-resume` | **ナビゲーターモード** - Q&A + フェーズ進行 |
| Spec³ | `/reforge-answer` | **マニュアルモード** - Q&A 専用 |
| 任意のフェーズ² | `/reforge-update` | 自然言語の変更指示を spec に適用する |
| 任意のフェーズ² | `/reforge-diff` | 直前スナップショットとの差分を表示する |
| Spec | `/reforge-validate` | `spec.json` の完全性と整合性を検証する |
| Prototype | `/reforge-render` | ローカル HTML プロトタイプを起動して人間が承認する |
| Plan | `/reforge-plan` | 承認済み spec から `tasks.json` を生成する |
| Implement | `/reforge-impl` | entity を 1 つ実装する（DB + API + UI + tests） |
| Verify | `/reforge-verify` | 実装が spec と一致しているか確認する |

¹ **全フェーズ** - `reforge-resume` は最初の質問から最終検証まで、すべてのフェーズゲートをナビゲートします。
² **任意のフェーズ** - メインフローに影響なく、いつでも呼べる補助コマンドです。
³ **マニュアルモード** - フェーズ進行なしで質問回答だけしたい場合に使います。

質問は必要に応じてバッチ化されます。最大 4 問までは一度に提示され、5 問以上の場合は `.reforge/specs/<name>/questions.md` に書き出されます。

## クイックスタート

```bash
cd your-project
npx aid-reforge install
```

その後、AI コーディングエージェント上で:

```
/reforge-init "現場スタッフ向けの日報アプリを作りたい"
/reforge-resume
```

既存リポジトリへの新機能なら:

```
/reforge-init "既存SaaS repoにチーム招待機能を追加したい。既存の認証、メール送信、チーム設定の規約に合わせる。"
/reforge-resume
```

`/reforge-resume` は現在地に応じて、質問、validate、render、approve、plan、impl、verify の次アクションを案内します。

### ワークフロー全体

**ナビゲーターモード** - `reforge-resume` に全フェーズを任せる:

```
/reforge-init "説明"    # spec と質問キューを生成
/reforge-resume         # 完了まで繰り返す
```

**マニュアルモード** - 各フェーズを個別に呼び出す:

```
/reforge-init "説明"
/reforge-answer         # pending questions がなくなるまで繰り返す
/reforge-validate
/reforge-render         # プロトタイプを確認 -> 承認
/reforge-plan
/reforge-impl
/reforge-verify
```

### 複数 specs

1 つのプロジェクトに複数の spec を持てます。機能や initiative ごとに 1 つです。

```
/reforge-init "日報アプリ"        # .reforge/specs/daily-report/ を生成
/reforge-init "フォトアルバム"    # .reforge/specs/photo-albums/ を生成

/reforge-resume photo-albums      # 特定の spec をナビゲート
/reforge-impl photo-albums User   # photo-albums の User entity を実装
```

spec が 1 つだけの場合は名前引数を省略できます。

## 対応環境

| 環境 | フォワーダーディレクトリ |
|---|---|
| **Claude Code** | `.claude/skills/` |
| **Codex** | `.agents/skills/` |

正準 Skill は `.reforge/skills/` に置かれます。

## ワークスペースファイル

Reforge の状態はプロジェクト内の `.reforge/specs/<name>/` に格納されます。

| ファイル | 役割 |
|---|---|
| `.reforge/specs/<name>/spec.json` | プロダクト仕様の source of truth |
| `.reforge/specs/<name>/questions.json` | pending / answered の質問キュー |
| `.reforge/specs/<name>/questions.md` | 大きな質問バッチをオフライン回答するための Markdown |
| `.reforge/specs/<name>/spec.previous.json` | `/reforge-diff` 用の直前 spec スナップショット |
| `.reforge/specs/<name>/tasks.json` | `/reforge-plan` が生成する実装タスクキュー |
| `.reforge/specs/<name>/tasks.previous.json` | `/reforge-update` が承認をリセットしたときに退避する旧タスクキュー |

```
.reforge/
├── server/                  # ローカルプロトタイプレンダラー
├── skills/                  # 正準 Reforge Skill
└── specs/
    └── <name>/
        ├── spec.json
        ├── questions.json
        ├── questions.md
        ├── spec.previous.json
        ├── tasks.json
        └── tasks.previous.json
```

ワークスペース状態をローカルに留めたい場合は `.reforge/` を `.gitignore` に追加します。複数マシンで進捗を共有したい場合はコミットできます。

## 動作要件

- Node.js 18 以上

## ドキュメント

- [ワークフローガイド](docs/guides/ja/workflow-guide.md) - 各フェーズのステップバイステップ解説
- [既存リポジトリへの導入](docs/guides/adopt-existing-repo.md) - Brownfield feature の使い方
- [スキルリファレンス](docs/reference/ja/skill-reference.md) - スキルごとの入力・出力・制約
- [English README](README.md)
