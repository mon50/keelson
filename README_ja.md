# Reforge

Reforge は自然言語のプロダクト説明を、構造化されたスペック・ローカル UI プロトタイプ・エンティティ単位の実装計画へと変換する。1 回のやり取りで 1 つの質問に答えるだけで進む。

[![npm version](https://img.shields.io/npm/v/reforge?logo=npm)](https://www.npmjs.com/package/reforge)
[![license: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

<div align="center"><sub>
README: <a href="./README.md">English</a> | 日本語
</sub></div>

## 何をするのか

Reforge はプロジェクトに **Agent Skills** をインストールする。Agent Skills とは、AI コーディングエージェントが各ワークフローステップをどう実行するかを教えるプレーンテキストの指示ファイルである。`npx aid-reforge install` を実行すると、これらのファイルが `.claude/skills/`（Claude Code）または `.agents/skills/`（Codex）にコピーされ、エージェントセッション内で `/reforge-*` スラッシュコマンドが使えるようになる。

各スキルはプロダクト開発ライフサイクルの 1 ステップを担う。

| フェーズ | スキル | 役割 |
|---|---|---|
| スペック | `/reforge-init` | 説明から `spec.json` と質問キューを生成する |
| 全フェーズ¹ | `/reforge-resume` | **ナビゲーターモード** — Q&A + フェーズ自動進行 |
| スペック³ | `/reforge-answer` | **マニュアルモード** — Q&A 専用（フェーズ案内はしない） |
| 任意のフェーズ² | `/reforge-update` | 自然言語の変更指示を spec に適用する |
| 任意のフェーズ² | `/reforge-diff` | 直前のスナップショットとの差分を表示する |
| スペック | `/reforge-validate` | `spec.json` の完全性と整合性を検証する |
| プロトタイプ | `/reforge-render` | ローカル HTML プロトタイプを起動して人間が承認する |
| 計画 | `/reforge-plan` | 承認済み spec から `tasks.json` を生成する |
| 実装 | `/reforge-impl` | エンティティを 1 つ実装する（DB + API + UI + テスト） |
| 検証 | `/reforge-verify` | 実装が spec と一致しているか確認する |

¹ **全フェーズ** — `reforge-resume` は最初の質問から最終検証まで、すべてのフェーズゲートを能動的にナビゲートする。  
² **任意のフェーズ** — メインのライフサイクルフローに影響なく、いつでも呼び出せるオプションのユーティリティ。  
³ **マニュアルモード** — フェーズ進行を自分で制御したいユーザー向け。Q&A のみ対応し、次のコマンドは推奨しない。

全スキルは `.reforge/specs/<name>/` 配下の共通データ契約を共有する。スキルは決定を勝手に埋めない — 不明点はペンディング質問になり、人間が回答する。

## クイックスタート

```bash
cd your-project
npx aid-reforge install
```

その後、AI コーディングエージェント上で:

```
/reforge-init "現場スタッフ向けの日報アプリを作りたい"
```

Reforge が `spec.json` を生成し、最初の質問を提示する。回答したら `/reforge-resume` で続行する。質問・検証・プロトタイプ・計画・実装のどのフェーズにいても、`/reforge-resume` が次に取るべきアクションを正確に案内する。

### ワークフロー全体像

**ナビゲーターモード** — `reforge-resume` に全フェーズを任せる:

```
/reforge-init "説明"    # spec と質問キューを生成
/reforge-resume         # 完了まで繰り返す — 質問 → validate → render → plan → impl → verify を順に案内
```

**マニュアルモード** — 各フェーズを個別に呼び出す（`reforge-resume` は質問回答のみに使う）:

```
/reforge-init "説明"    # spec と質問キューを生成
/reforge-resume         # 未解決の質問に 1 つずつ回答（質問がなくなるまで繰り返す）
/reforge-validate       # spec の完全性を確認
/reforge-render         # プロトタイプを確認 → 承認
/reforge-plan           # 実装タスクを生成
/reforge-impl           # エンティティを 1 つずつ実装
/reforge-verify         # spec に対して検証
```

### 複数スペック

1 つのプロジェクトに複数の spec を持てる — 機能やイニシアティブごとに 1 つ:

```
/reforge-init "日報アプリ"        # .reforge/specs/daily-report/ を生成
/reforge-init "フォトアルバム"    # .reforge/specs/photo-albums/ を生成

/reforge-resume photo-albums      # 特定の spec をナビゲート
/reforge-impl photo-albums User   # photo-albums の User エンティティを実装
```

spec 名は説明から自動導出される（kebab-case スラッグ）。spec が 1 つだけの場合は名前の引数を省略できる。

## 対応環境

| 環境 | スキルディレクトリ |
|---|---|
| **Claude Code** | `.claude/skills/` |
| **Codex** | `.agents/skills/` |

`reforge install` はアクティブな環境を自動検出して適切な場所にインストールする。両方が存在する場合は両方にインストールされる。

## ワークスペースファイル

Reforge のすべての状態はプロジェクト内の `.reforge/specs/<name>/` に格納される。これらのファイルを移動・名前変更してはならない — すべてのコンポーネントが標準パスに依存しているため。

```
.reforge/
├── server/                  # ローカルプロトタイプレンダラー（/reforge-render が作成）
└── specs/
    └── <name>/              # spec ごとに 1 ディレクトリ（説明から自動命名）
        ├── spec.json        # プロダクト仕様の Single Source of Truth
        ├── spec.previous.json  # 直前のスナップショット（/reforge-diff で使用）
        ├── questions.json   # 未解決・解決済み質問キュー
        ├── tasks.json       # 実装タスクキュー（/reforge-plan が生成）
        └── tasks.previous.json  # /reforge-update が承認リセット時に旧 tasks.json を退避
```

ワークスペース状態をローカルに留めたい場合は `.reforge/` を `.gitignore` に追加する。複数マシンで進捗を共有したい場合はコミットする。

## 動作要件

- Node.js 18 以上

## ドキュメント

- [ワークフローガイド](docs/guides/ja/workflow-guide.md) — 各フェーズのステップバイステップ解説
- [スキルリファレンス](docs/reference/ja/skill-reference.md) — スキルごとの入力・出力・制約
- [English README](README.md)
