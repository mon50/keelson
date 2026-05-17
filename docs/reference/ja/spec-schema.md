# アーティファクトスキーマ

<sub>[← Keelson ドキュメント](../../README.md) · [English](../spec-schema.md) | 日本語</sub>

唯一の真実は、承認済みのアーティファクト束です。

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

## マニフェスト

```json
{
  "version": 1,
  "feature": "team-invitations",
  "currentPhase": "prototype",
  "artifacts": {
    "requirements": { "path": "requirements.md", "phase": "requirements", "status": "approved" },
    "userStories": { "path": "user-stories.md", "phase": "user-stories", "status": "approved" },
    "usMock": { "path": "us-mock.html", "phase": "user-stories", "status": "approved" },
    "design": { "path": "design.md", "phase": "design", "status": "approved" },
    "prototype": { "path": "prototype.html", "phase": "prototype", "status": "draft" },
    "plan": { "path": "plan.md", "phase": "plan", "status": "draft" }
  }
}
```

ステータスは `draft`・`needs_revision`・`approved` のいずれかです。

## 監査証跡

`audit.md` はサポートファイルであり、マニフェストのアーティファクトでもフェーズゲートでもありません。セッションをまたいだ継続性を保ちます。

必須の見出し:

- `# Audit Trail`
- `## Chronological Log`
- `## Resume Point`

各フェーズは、ユーザー入力・エージェントの判断・アーティファクトの変更・検証結果について、日付つきのログエントリを追記します。`Resume Point` セクションは、現在のフェーズ・承認済みアーティファクト・次のコマンド・ブロッカー・最後の検証結果で、その場で更新します。
