# Reforge

Reforge は `.reforge/` 配下の標準ファイルを共有データ契約として扱う。各コマンドとコンポーネントは同じパスを読む前提で動作する。

## .reforge/ ディレクトリ構造

<!-- `.reforge/` 配下のパスは変更してはならない。全コンポーネントが標準パスとして依存するため。 -->

`.reforge/` は Reforge ワークスペースファイルの標準ディレクトリである。

```text
.reforge/
├── spec.json
├── spec.previous.json
├── questions.json
└── tasks.json
```

| パス | 役割 |
|---|---|
| `.reforge/spec.json` | プロダクト仕様の Single Source of Truth。`meta`, `tech`, `entities`, `views`, `flows` を保持する。 |
| `.reforge/spec.previous.json` | 直前の spec スナップショット。diff 操作で現在の `spec.json` と比較するために使う。 |
| `.reforge/questions.json` | 質問キュー。`pending` と `answered` を保持し、全コマンドが不明点の追加・解決状態を共有する。 |
| `.reforge/tasks.json` | 実装タスクキュー。`/reforge:plan` が entity 単位タスクを生成し、`/reforge:impl` が消化する。 |

`.reforge/` 配下のパスは変更してはならない。engine / renderer / impl / installer / validate が標準パスとして依存するため、ファイル名や配置を変更するとコンポーネント間のデータ共有が壊れる。

`.reforge/` 配下のファイルをバージョン管理対象にするかはプロジェクトごとに判断する。共有したくない場合は `.gitignore` に追加する。
