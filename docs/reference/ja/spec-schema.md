# アーティファクトスキーマ

<sub>[← Keelson ドキュメント](../../README.md) · [English](../spec-schema.md) | 日本語</sub>

唯一の真実は、承認済みのアーティファクト束です。

```text
.keelson/<feature>/
  manifest.json
  audit.md
  verify-report.md                   (/keel-verify 後)
  01-requirements/requirements.md
  02-user-stories/user-stories.md
  02-user-stories/us-mock.html
  03-design/design.md
  04-prototype/prototype.html
  04-prototype/prototype-notes.md    (optional)
  05-plan/plan.md
```

フェーズ所有のファイルは番号付き子ディレクトリに格納します。各フェーズの添付物（スクリーンショット・ノート・参考資料・エビデンス）はその子ディレクトリの中に置きます。ワークスペース全体に対するファイル — `manifest.json`・`audit.md`・`verify-report.md` — はフィーチャー直下に置きます。

`/keel-quick` で扱う小さな変更の場合、ワークスペースはフラットのままです。

```text
.keelson/<feature>/
  manifest.json        (track: "quick")
  audit.md
  change.md
```

## マニフェスト

```json
{
  "version": 1,
  "feature": "team-invitations",
  "currentPhase": "prototype",
  "artifacts": {
    "requirements": { "path": "01-requirements/requirements.md", "phase": "requirements", "status": "approved" },
    "userStories": { "path": "02-user-stories/user-stories.md", "phase": "user-stories", "status": "approved" },
    "usMock": { "path": "02-user-stories/us-mock.html", "phase": "user-stories", "status": "approved" },
    "design": { "path": "03-design/design.md", "phase": "design", "status": "approved" },
    "prototype": { "path": "04-prototype/prototype.html", "phase": "prototype", "status": "draft" },
    "plan": { "path": "05-plan/plan.md", "phase": "plan", "status": "draft" }
  }
}
```

`path` は `.keelson/<feature>/` からの相対パスです。スキルはファイル名を推測するのではなく、この `path` フィールドからアーティファクトの場所を解決するため、レイアウトを変更しても全スキルを直接書き換える必要はありません。

ステータスは `draft`・`needs_revision`・`approved` のいずれかです。

## 監査証跡

`audit.md` はサポートファイルであり、マニフェストのアーティファクトでもフェーズゲートでもありません。セッションをまたいだ継続性を保ちます。

必須の見出し:

- `# Audit Trail`
- `## Chronological Log`
- `## Resume Point`

各フェーズは、ユーザー入力・エージェントの判断・アーティファクトの変更・検証結果について、日付つきのログエントリを追記します。`Resume Point` セクションは、現在のフェーズ・承認済みアーティファクト・次のコマンド・ブロッカー・最後の検証結果で、その場で更新します。
