# Hello Keelson (クイック) チュートリアル

<sub>[← Keelson ドキュメント](../../README.md) · [English](../hello-keelson-quick.md) | 日本語</sub>

**対象読者:** Keelson をはじめて使い、小さな単発の変更でワークフローを体感したい開発者。
**前提条件:** Node.js 18 以上、Claude Code または Codex がインストール済み、編集可能なリポジトリ。
**到達点:** クイックトラックを最後まで実行する — 変更ブリーフ、承認、実装、検証まで約 5 分。

新規 UI surface や複数のユーザー操作を含むフル機能を試したい場合は、[Hello Keelson (フル)](hello-keelson.md) を参照してください。

## ステップ 1: Keelson をインストール

```bash
npx keelson-cli install
```

`.claude/skills` と `.agents/skills` に `/keel-*` スキルが配置されます。

## ステップ 2: フロントドアから始める

リポジトリの中で、よく理解できている小さな変更を選びます。最初の題材としては、プロジェクトの `README.md` のタイポ修正のように、単一ファイル・新しいユーザー操作なし・新しい UI surface なし、の変更がおすすめです。

AI エージェント内で:

```
/keel-discovery "README.md のタイポを修正（'recieve' を 'receive' に置換）"
```

`/keel-discovery` がアイデアを明確化し、Track Decision Checklist を適用します。

- 新しい UI surface を追加するか? → なし ✓
- 新しいユーザー操作が生じるか? → なし ✓
- 製品上の曖昧さがあるか? → なし ✓
- 単一ファイルに収まるか? → 収まる ✓

4 項目すべて通過するので、discovery は `/keel-quick` にルーティングし、`.keelson/discovery.md` を書き出します。

## ステップ 3: クイックトラックを実行

```
/keel-quick "README のタイポ修正: recieve -> receive"
```

`/keel-quick` は `.keelson/<feature>/change.md` に変更ブリーフ（intent / scope / affected files / acceptance / risks）を書き、コードを触る前にブリーフの承認を求めます。

チャットでブリーフを承認します（例: `approved` と返信）。承認後、`/keel-quick` は次を行います。

1. ブリーフに記載されたファイルを最小限の編集で更新。
2. 影響範囲のテスト・lint・ビルドを実行。
3. 結果を `change.md` に記録し、`audit.md` にエントリを追記。

## ステップ 4: 検証

単一ファイルのタイポ修正であればクイックトラックのチェックで十分なことが多く、`/keel-quick` は `/keel-status` を勧めて終了します。それ以上の規模、または監査記録を残したい場合は次を実行します。

```
/keel-verify
```

`/keel-verify` はフィーチャーワークスペース直下に `verify-report.md` を作成し、実装内容・実行したチェック・残った手動検証を要約します。

## 何が起きたか

ラフなアイデアから、承認 → 実装 → 検証までを、他のフェーズに触れずに通り抜けました。ワークスペースの中身は次の通りです。

```
.keelson/<feature>/
  manifest.json        (track: "quick")
  audit.md
  change.md
  verify-report.md     (/keel-verify を実行した場合)
```

`01-requirements/` も `02-user-stories/` もなく、design / prototype フェーズも走っていません。この変更にはどれも不要だからです。

## いつフルフローを使うか

次のアイデアが新しい画面の追加、新しいユーザー操作の導入、未決定の意思決定を含むなら、`/keel-discovery` は代わりに `/keel-requirements` にルーティングします。その場合は [Hello Keelson (フル)](hello-keelson.md) に進んでください。
