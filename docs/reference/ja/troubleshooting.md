# トラブルシューティング — ブロック条件と戻り先

<sub>[← Keelson ドキュメント](../../README.md) · [English](../troubleshooting.md) | 日本語</sub>

Keelson の各フェーズには明示的なブロック条件と、ギャップを所有するアーティファクトへ戻る明示的なルートがあります。下表は遭遇しうる状況から実行すべきコマンドへのマッピングです。判定ルールの正本は各スキルの `SKILL.md` にあり、本ページはそれを集約したリファレンスです。

## ブロック条件と解決コマンド

| 状況 | 所有フェーズ | 実行コマンド |
|---|---|---|
| `.keelson/<feature>/` ワークスペースがまだない | (entry) | ラフ／大きいアイデアは `/keel-discovery "<idea>"`、明確な単機能は `/keel-requirements "<idea>"` |
| `/keel-us` がブロック: `artifacts.requirements.status` が `approved` でない | requirements | `/keel-requirements` |
| `/keel-design` がブロック: `requirements`・`userStories`・`usMock` のいずれかが `approved` でない | 未承認の最も早いフェーズ | `/keel-requirements` → `/keel-us` |
| `/keel-proto` がブロック: `design`（または前のいずれか）が `approved` でない | 未承認の最も早いフェーズ | `/keel-design` とその前段 |
| `/keel-plan` がブロック: `prototype`（または前のいずれか）が `approved` でない | 未承認の最も早いフェーズ | `/keel-proto` とその前段 |
| `/keel-impl` がブロック: `artifacts.plan.status` が `approved` でない | plan | `/keel-plan` |
| `/keel-verify` がブロック: `artifacts.plan.status` が `approved` でない | plan | `/keel-plan` |

## 不一致の戻し先（後続フェーズが問題を発見した場合）

| 症状 | 所有フェーズ | 実行コマンド |
|---|---|---|
| User Stories / US mock で要件の曖昧さや欠落が判明 | requirements | `/keel-requirements` |
| Design でユーザー操作の欠落や矛盾が判明 | user-stories | `/keel-us` |
| Design で既存実装との両立が不可能な要件が判明 | requirements | `/keel-requirements` |
| プロトタイプの体験が誤っている（US の流れが噛み合わない） | user-stories | `/keel-us` |
| プロトタイプが design と矛盾する（デザイン方針が崩れる） | design | `/keel-design` |
| Plan が `Files To Touch` 外、または `Files Not To Touch` 内のファイルを必要としそう | design | `/keel-design` |
| 実装が `Files To Touch` 外のファイルを必要とする | design | `/keel-design`（その後 `/keel-plan`） |
| 実装中に要件不足が出た | requirements | `/keel-requirements` |
| 実装中に user operation 不足が出た | user-stories | `/keel-us` |
| 実装中に design 不足が出た | design | `/keel-design` |
| `/keel-verify` が失敗または未完のタスクを報告 | plan | `/keel-impl` |
| `/keel-quick` のブリーフが結局 新しい user surface / 操作 を含むと判明 | requirements | 理由を `change.md` に記録し `/keel-requirements` へ |

## 自分の位置が分からないとき

| 状況 | 実行コマンド |
|---|---|
| リポジトリを開いたが、どのフェーズにいるか分からない | `/keel-status`（read-only） |
| `manifest.json` と `audit.md` Resume Point が食い違っている | `/keel-status` が衝突を可視化する。次のフェーズコマンドを叩く前に解消する |
| 古いワークスペースに `manifest.json` はあるが `audit.md` がない | そのワークスペースの次フェーズコマンドを叩けば `audit.md` が作成される |

## 戻し先設計の原則

- 未解決の疑問は、それを所有するアーティファクトに書き込む。チャットに残さない。未解決の疑問はそのフェーズの承認をブロックする。
- 後続フェーズが上流のギャップを独自に埋めることはない。上流の artifact を `needs_revision` にマークし、戻す。
- `manifest.json` は索引であり、仕様本体は承認済みの Markdown / HTML artifact。マニフェストではなくアーティファクト本文を編集する。
- `audit.md` は継続ログ。発生事項を記録するもので、フェーズゲートではない。
