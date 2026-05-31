# Hello Keelson (フル) チュートリアル

<sub>[← Keelson ドキュメント](../../README.md) · [English](../hello-keelson.md) | 日本語</sub>

**対象読者:** Keelson をはじめて使い、1 つのフル機能を最初から最後まで作りたい開発者。
**前提条件:** Node.js 18 以上、Claude Code または Codex がインストール済み。
**到達点:** 承認済みの Inception アーティファクト、プロトタイプ、実装プラン、検証済みの実装を作成します。

小さな変更やバグ修正の場合は、短い [Hello Keelson (クイック)](hello-keelson-quick.md) チュートリアルを使ってください。

## ステップ 1: Keelson をインストール

```bash
npx keelson-cli install
```

## ステップ 2: フロントドアから始める

小さく、しかし実体のある機能を選びます。新しい UI surface か、新しいユーザー操作が 1 つだけあるものが良い題材です。可視 UI を持ちつつ可動部分が少ない「日報アプリ」は最初の題材として優れています。

```
/keel-discovery "日報アプリ — 短い日報を記録し、過去 7 日間を振り返れる単画面アプリ"
```

`/keel-discovery` がアイデアを明確化し、Track Decision Checklist を適用し、`.keelson/discovery.md` を書き出します。新しい UI surface と新しいユーザー操作を含むため、discovery はフルフローへルーティングします。

## ステップ 3: 要件

```
/keel-requirements "日報アプリ"
```

Keelson は `01-requirements/requirements.md` を作成し、フィーチャー直下に `manifest.json` と `audit.md` を初期化します。要件（目的・ユーザー・スコープ・受け入れ条件・UI デザイン期待値）を確認し、求められたら承認して次に進みます。

## ステップ 4: ユーザーストーリーと US モック

```
/keel-us
```

Keelson は `02-user-stories/user-stories.md` と `02-user-stories/us-mock.html` を作成します。`us-mock.html` をブラウザで開き、各ストーリーのシナリオを確認し、Approved にトグルするか Changes コメントを入力し、**Copy review feedback** ボタンでまとめてチャットに貼り戻します。ストーリーが要件をカバーしていれば承認します。

## ステップ 5: 設計

```
/keel-design
```

Keelson は既存実装のエビデンスと承認済みストーリーに基づいて `03-design/design.md` を作成します。アーキテクチャ・編集可能ファイル・編集禁止ファイル・ビジュアル方針を確認し、問題なければ承認します。

## ステップ 6: プロトタイプ

```
/keel-proto
```

Keelson は `04-prototype/prototype.html` を作成します。ブラウザで開き、ユーザーストーリーの体験とデザイン方針を検証します。体験が違えば `/keel-us` へ、デザインが違えば `/keel-design` へ、Keelson が戻します。両方とも噛み合っていれば承認します。

## ステップ 7: プラン

```
/keel-plan
```

Keelson は安定 ID（`T-001`、`T-002`、…）を持つタスクリストを含む `05-plan/plan.md` を作成し、ユーザーストーリーと設計に紐づけます。プランを承認します。

## ステップ 8: 実装

```
/keel-impl T-001
```

Keelson は Kiro 流のループで 1 タスクを実装します。コードを調査し、必要ならテストを追加・更新し、最小限の変更を実装し、チェックを実行し、`05-plan/plan.md` に実装メモを記録します。`T-002`、`T-003`、… と進め、プランを完了させます。

## ステップ 9: 検証

```
/keel-verify
```

全タスク完了後、`/keel-verify` は実装を承認済みアーティファクト束に対して監査します。タスク完了状況、トレーサビリティ、アーティファクト間の整合、境界の遵守、プロジェクトのチェック実行を確認し、フィーチャー直下に `verify-report.md` を作成して、ギャップがあればそれを所有するフェーズと共に報告します。

## 何が起きたか

アイデアを `/keel-discovery` でルーティングし、6 つの承認済みアーティファクトを作成し、すべてのプランタスクを実装し、結果を検証しました。ワークスペースの中身は次の通りです。

```
.keelson/features/<feature>/
  manifest.json
  audit.md
  verify-report.md
  01-requirements/requirements.md
  02-user-stories/user-stories.md
  02-user-stories/us-mock.html
  03-design/design.md
  04-prototype/prototype.html
  05-plan/plan.md
```

各フェーズに承認ゲートがあり、あなたが下した判断より先に AI が進むことはありません。後続フェーズで不一致が見つかった場合、Keelson はその場しのぎではなく、問題を所有するアーティファクトへ戻します。
