# Reforge（OSS設計仕様書）

---

# 🎯 目的

Reforgeは、自然言語で与えられたプロダクト構想を
**実装可能な仕様（Spec）へ収束させるOSSである。**

👉 ゴールは「コード生成」ではなく
**“曖昧さのない仕様完成”**

---

# 🧠 コアコンセプト

## Core Idea

👉 **“Define intent → Resolve ambiguity → Produce executable spec”**

- UIではなくSpecが本体
- Specは対話で収束する
- 実装は結果物にすぎない

---

# 🧩 システムの本質

## Reforge = Spec Engine

```plaintext
Input（自然言語）
   ↓
Intent解析
   ↓
Question Engine（不足補完）
   ↓
Spec生成・更新
   ↓
検証（validate）
   ↓
レンダリング（render）
```

---

# 📦 spec.json（中核構造）

## 🎯 定義

**spec.json = プロダクトの唯一の真実（Single Source of Truth）**

---

## 🧱 構造

```json
{
  "meta": {
    "name": "string",
    "version": "0.1.0"
  },

  "entities": {
    "report": {
      "fields": {
        "date": { "type": "date", "required": true },
        "content": { "type": "text" },
        "status": { "type": "enum", "options": ["draft", "submitted"] }
      }
    }
  },

  "flows": {
    "submit": {
      "steps": []
    }
  },

  "views": {
    "form": {
      "type": "form",
      "entity": "report",
      "fields": ["date", "content"]
    }
  },

  "ui": {
    "layout": []
  }
}
```

---

# 🧠 Entity設計（最重要概念）

## 🎯 定義

👉 **Entity = プロダクトが扱う中心データ単位**

例：
- report（日報）
- user（ユーザー）
- project（プロジェクト）

---

## 🔁 役割

Entityは全ての起点

```plaintext
Entity → View（UI）
       → Flow（業務）
       → Behavior（ロジック）
```

---

## MVP方針

👉 初期は1 Entityのみ（例：report）

---

# 🧠 Question Engine

## 🎯 目的

👉 不足仕様を「逐次的に確定」する

---

## 🔁 動作原理

```plaintext
Spec生成
   ↓
未確定要素抽出
   ↓
依存関係チェック
   ↓
次に聞く1問を選択
   ↓
Answer反映
   ↓
Spec更新
```

---

## 🧩 Question構造

```json
{
  "id": "define_fields",
  "phase": "data",
  "question": "このアプリで扱う項目は？",
  "type": "multi_input",
  "resolves": ["entities.*.fields"]
}
```

---

## 🧠 原則

- 1回に1問
- 依存関係順に質問
- 推測は禁止（必ずQuestion化）

---

# 🧠 Answer処理

```plaintext
[Answer]
日付, 内容
```

↓

```diff
entities.report.fields += { date, content }
```

---

# 🔍 validate

## 🎯 目的

👉 Specの完全性チェック

---

## チェック項目

- 未解決Questionの有無
- 参照整合性
- Flow成立性

---

## 出力

```plaintext
✔ valid
```

or

```plaintext
✖ incomplete: status missing
```

---

# 🖥 render

## 🎯 目的

👉 Specを実際に触れるHTML Mockへ変換

---

## 特徴

- UIはSpecの投影
- 編集不可（確認専用）
- フォーム・一覧表示のみ

---

## 生成フロー

```plaintext
spec.json → renderer → HTML
```

---

# 🔁 diff

## 🎯 目的

👉 Spec変更差分の可視化

---

## 出力例

```diff
+ entities.report.fields.approval_comment
+ flows.approval
```

---

# 🧭 CLIコマンド設計

```bash
/reforge:init "日報アプリ"
/reforge:update "承認コメント追加"
/reforge:validate
/reforge:diff
/reforge:render
```

---

# 🧠 全体思想

## ❌ UIは編集対象ではない
## ❌ 推測で仕様を埋めない

---

## ✅ 正解

👉 **すべてはSpec更新として扱う**

---

# 🚀 コンセプト

👉 **“From intent to executable specification.”**

---

# 🏁 Reforgeの本質

👉 **「曖昧なアイデアを、壊れない仕様へ収束させるOSS」**

