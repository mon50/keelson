# Reforge Resume Examples

## Example 1: Pending Question
```text
進行: [✓]Init → [▶]Questions → [ ]Validate → [ ]Approve → [ ]Plan → [ ]Impl → [ ]Verify → [ ]Done  (2/8)
現在: Questions フェーズ — 未解決質問 3 件
NextAction: 提示した質問に回答 → reforge-resume を再実行

Action: ask_question
[tech_frontend] What frontend framework would you like to use?
```

## Example 2: Recording an Answer
```text
進行: [✓]Init → [▶]Questions → [ ]Validate → [ ]Approve → [ ]Plan → [ ]Impl → [ ]Verify → [ ]Done  (2/8)
現在: Questions フェーズ — 未解決質問 2 件（残）
NextAction: 提示した質問に回答 → reforge-resume を再実行

Action: record_answer
Recorded answer for 'tech_frontend' -> "Next.js". Updated spec.json at 'tech.frontend'. Question moved to answered.
```

## Example 3: Recommending Next Command (post-update flow)
```text
進行: [✓]Init → [✓]Questions → [✓]Validate → [▶]Approve → [ ]Plan → [ ]Impl → [ ]Verify → [ ]Done  (4/8)
現在: Approve フェーズ — meta.approved=false（直前の reforge-update により再承認待ち）
NextAction: UI プロトタイプを再承認 → reforge-render

Action: recommend_command
Recommended command: reforge-render
Reason: spec was updated; previous approval invalidated.
```

## Example 4: Post-Approval Re-Plan
```text
進行: [✓]Init → [✓]Questions → [✓]Validate → [✓]Approve → [▶]Plan → [ ]Impl → [ ]Verify → [ ]Done  (5/8)
現在: Plan フェーズ — tasks.json なし（reforge-update 時に tasks.previous.json へ退避済み）
NextAction: タスクキュー再生成 → reforge-plan

Action: recommend_command
Recommended command: reforge-plan
Reason: tasks.json was retired by a prior reforge-update; regenerate against the new spec.
```
