---
name: reforge-resume
description: Resume a Reforge specification session from .reforge/questions.json and present exactly one pending question.
allowed-tools: Read, Write, Edit, Glob, AskUserQuestion
---

# reforge-resume

## Core Rule

- Think in English, respond to the user in the language specified by `meta.lang`.
- Treat `.reforge/spec.json` as the single source of truth for the product specification.
- Do not invent missing product decisions. Convert unknowns into pending questions.
- Ask at most one user-facing question per run.
- Keep the skill self-contained. Do not require external prompt files.

## Canonical Paths

- `REFORGE_DIR = ".reforge"`
- `SPEC_PATH = ".reforge/spec.json"`
- `QUESTIONS_PATH = ".reforge/questions.json"`
- `PREVIOUS_SPEC_PATH = ".reforge/spec.previous.json"`
- `TASKS_PATH = ".reforge/tasks.json"`

## Prompt Kernel

Use this shared kernel for every reforge-engine command.

### Intent

- Convert natural-language intent into a core-compliant Reforge spec lifecycle.
- Preserve human judgment. If a product decision is not explicit, ask instead of deciding.
- Keep the lifecycle visible: intent captured, ambiguity queued, next gate reported.

### Current State

- Read the current workspace state before changing files.
- If `SPEC_PATH` exists, parse it before deciding whether the command may continue.
- If `QUESTIONS_PATH` exists, parse it before adding or removing questions.
- Determine response language from parsed `spec.meta.lang`; if missing or unreadable, use English.

### Constraints

- `no_guessing`: Do not fill fields, flows, views, enum options, required flags, names, roles, or approval rules without evidence.
- `one_question_only`: Present only the single highest-priority pending question.
- `core_schema_compliant`: Writes must preserve `meta`, `tech`, `entities`, `flows`, and `views` in `spec.json`, and `pending`, `answered` in `questions.json`.
- `preserve_human_decision`: If a branch requires user judgment, use AskUserQuestion when available. If unavailable, ask one concise question in chat and stop.
- `language_consistent`: Localize explanations and questions using `meta.lang`; keep file paths, JSON keys, status markers, and command names literal.

### Output Contract

Every run ends with exactly one of these outcomes:

- `files_written`: files changed, summary reported, pending count reported.
- `question`: one question presented, partial state saved when safe.
- `blocked`: no unsafe write performed, reason reported, next action provided.
- `complete`: no mutation needed, current state and next gate reported.

### Quality Gate

Before responding, verify:

- Any written spec has `meta.name`, `meta.version`, `meta.lang`, `meta.approved`, `tech`, `entities`, `flows`, and `views`.
- Any written field type is one of `string`, `number`, `date`, `enum`, `text`, `boolean`.
- Any written enum has at least one string option.
- Any written question entry has `id`, `phase`, `question`, `type`, and `resolves`.
- `pending` does not contain duplicate unresolved questions for the same normalized `resolves` set.
- The response includes lifecycle stage, changed artifacts, pending count, and the next gate.

## Command Flow

### Navigator Decision Tree

このナビゲーターは必ず下記の順序で状態を評価し、最初に一致した条件で停止する。後続条件を先に評価してはならない。

1. `SPEC_PATH` missing
   - `.reforge/spec.json` が存在しない場合は、`/reforge:init "<description>"` を案内して `blocked` として終了する。
   - `SPEC_PATH` が invalid JSON の場合も、修正すべきファイルを報告して終了する。
2. `QUESTIONS_PATH` pending
   - `.reforge/questions.json` を読み取り、`pending` が1件以上ある場合は最優先の1件だけを AskUserQuestion で提示する。
   - Present exactly one pending question. 同じ実行で2問目を提示してはならない。
   - 回答を受け取った場合は `resolves` のJSONパスへ反映し、質問を `pending` から `answered` へ移動して終了する。
3. `reforge-validate fails`
   - pending が0件の場合に限り、reforge-core の検証規則に従って `SPEC_PATH` を確認する。
   - 検証エラーがある場合はエラーを表示し、`/reforge:validate` で問題を解消するよう案内して終了する。
4. `meta.approved` is `false`
   - `meta.approved` が `false` か未設定の場合は、`/reforge:render` でUIプロトタイプを確認・承認するよう案内して終了する。
5. `TASKS_PATH` missing
   - `meta.approved` が `true` で `.reforge/tasks.json` が存在しない場合は、`/reforge:plan` を案内して終了する。
6. `pending` or `in_progress` task exists
   - `TASKS_PATH` に `status: "pending"` または `status: "in_progress"` のタスクがある場合は、最初の対象 `entity` で `/reforge:impl <entity>` を案内して終了する。
7. `verification is not complete`
   - すべてのタスクが `done` で、検証完了の証跡がない場合は `/reforge:verify` を案内して終了する。
8. `project complete`
   - すべてのタスクが `done` で検証完了の証跡がある場合のみ、プロジェクト完了を報告する。

### State Reads

1. Read `SPEC_PATH` before all other state files.
2. Read `QUESTIONS_PATH` only after `SPEC_PATH` exists and is valid JSON.
3. Read `TASKS_PATH` only after pending questions are empty, validation passes, and `meta.approved` is `true`.
4. Do not invoke other Reforge skills directly. Read state, report the matching branch, and guide the user to the next command.

## Answer Application

If this resume run includes a user answer to a previously presented question:

1. Identify the pending question being answered.
2. Apply the answer only to paths listed in `resolves`.
3. If the answer is insufficient for every `resolves` path, do not mutate `SPEC_PATH`; leave the question in `pending` and ask one clarifying question.
4. If the answer resolves the question:
   - Update only the resolved spec paths.
   - Remove the question from `pending`.
   - Append it to `answered`.
   - Keep required fields `id`, `phase`, `question`, `type`, and `resolves`.
   - Optionally add `answer` and `answeredAt`.
5. Run the Quality Gate before writing.

## Core Compliance Rules

- Never create a field with an unknown type.
- Never create `enum` without one or more explicit options.
- Never remove unrelated spec paths while applying an answer.
- Never infer additional fields from examples unless the user explicitly confirms them.

## Completion Report

Report concisely:

- Lifecycle stage: `resumed`, `answered`, or `complete`.
- Changed artifacts: `SPEC_PATH` and/or `QUESTIONS_PATH`, or `none`.
- Pending question count.
- Next gate:
  - If pending count is 0: `/reforge:validate`.
  - If pending count is greater than 0: answer the single presented question or run `/reforge:resume`.
