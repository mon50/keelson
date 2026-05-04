import type { ShellSlots } from './types';
import { escapeHtml } from './utils';

export function renderShell(slots: ShellSlots): string {
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(slots.appName)} 仕様確認</title>
  <style>
    :root { color-scheme: light; --bg:#f6f7f9; --panel:#fff; --soft:#eef5f3; --line:#d7dde3; --text:#1f2933; --muted:#647181; --accent:#0f766e; --danger:#a13636; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; min-width: 320px; background: var(--bg); color: var(--text); letter-spacing: 0; }
    button, input, select, textarea { font: inherit; letter-spacing: 0; }
    button { cursor: pointer; }
    .app-shell { min-height: 100vh; display: grid; grid-template-columns: 260px minmax(0, 1fr); }
    .sidebar { border-right: 1px solid var(--line); background: #fbfcfd; padding: 20px 16px; display: flex; flex-direction: column; gap: 20px; }
    .brand-title { margin: 0; font-size: 16px; line-height: 1.3; font-weight: 760; }
    .brand-subtitle, .section-label, .nav-meta, .surface-head p, .spec-fact p { color: var(--muted); }
    .section-label { font-size: 11px; font-weight: 760; text-transform: uppercase; }
    .nav-list { display: grid; gap: 8px; }
    .nav-item { width: 100%; border: 1px solid transparent; border-radius: 8px; background: transparent; display: flex; align-items: center; gap: 10px; padding: 8px 10px; text-align: left; color: var(--text); }
    .nav-item.active { background: var(--soft); border-color: #b6ded8; color: #0b524d; }
    .nav-icon { width: 26px; height: 26px; border-radius: 7px; display: grid; place-items: center; background: #e8eef2; font-size: 11px; font-weight: 760; flex: 0 0 auto; }
    .nav-title { display: block; font-size: 13px; font-weight: 740; line-height: 1.25; }
    .nav-meta { display: block; font-size: 11px; line-height: 1.25; margin-top: 2px; }
    .main { min-width: 0; padding: 24px; display: grid; gap: 18px; align-content: start; }
    .topbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .topbar h1 { margin: 0; font-size: 22px; line-height: 1.25; }
    .reload-error { border: 1px solid #f0b8b8; background: #fff0f0; color: var(--danger); padding: 10px 12px; border-radius: 8px; }
    .explanation-panel, .prototype-area, .non-ui-spec-area { display: grid; gap: 12px; }
    .spec-context { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 10px; }
    .spec-fact, .surface { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 16px; }
    .spec-fact h3, .surface h2, .spec-check h3 { margin: 0; line-height: 1.3; }
    .spec-fact p, .surface-head p, .spec-check p { margin: 6px 0 0; line-height: 1.55; }
    .layout-toolbar { display: flex; gap: 8px; align-items: center; }
    .layout-chip { border: 1px solid var(--line); background: var(--panel); border-radius: 999px; padding: 6px 12px; }
    .layout-chip.active { border-color: var(--accent); color: var(--accent); background: var(--soft); }
    .layout-preview[hidden], .view-panel[hidden], .prototype-area[hidden], .non-ui-spec-area[hidden], .layout-toolbar[hidden], [hidden] { display: none !important; }
    .field-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-top: 14px; }
    .field-control { display: grid; gap: 6px; }
    .field-label { font-size: 12px; font-weight: 720; }
    input, select, textarea { width: 100%; border: 1px solid var(--line); border-radius: 8px; padding: 9px 10px; background: #fff; color: var(--text); }
    .form-actions { margin-top: 14px; display: flex; align-items: center; gap: 12px; }
    .primary-action { border: 0; border-radius: 8px; background: var(--accent); color: #fff; padding: 10px 14px; font-weight: 740; }
    .success-feedback { color: var(--accent); font-weight: 720; }
    .prototype-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    .prototype-table th, .prototype-table td { border-bottom: 1px solid var(--line); padding: 10px 8px; text-align: left; }
    .detail-list { display: grid; gap: 8px; margin: 12px 0 0; }
    .detail-list div { display: grid; grid-template-columns: 140px minmax(0,1fr); gap: 10px; border-bottom: 1px solid var(--line); padding: 8px 0; }
    .detail-list dt { color: var(--muted); }
    .phone-frame { max-width: 390px; border: 10px solid #20242a; border-radius: 28px; background: #20242a; margin: 0 auto; }
    .mobile-panel { border-radius: 18px; overflow: hidden; background: var(--bg); }
    .spec-check-list { margin: 10px 0 0; padding-left: 18px; line-height: 1.6; }
    @media (max-width: 760px) { .app-shell { grid-template-columns: 1fr; } .sidebar { border-right: 0; border-bottom: 1px solid var(--line); } .main { padding: 16px; } .topbar { align-items: flex-start; flex-direction: column; } }
  </style>
</head>
<body>
  <div class="app-shell" id="app-shell">
    <aside class="sidebar" aria-label="仕様確認項目">
      <div class="brand">
        <p class="brand-title">${escapeHtml(slots.appName)}</p>
        <p class="brand-subtitle">${escapeHtml(slots.appMeta)}</p>
      </div>
      <nav class="side-section" aria-label="仕様確認">
        <span class="section-label">仕様確認</span>
        <div class="nav-list">
          ${slots.sidebarHtml}
        </div>
      </nav>
    </aside>
    <main class="main">
      <header class="topbar">
        <div>
          <h1>仕様確認</h1>
          <p class="brand-subtitle">UIプロトタイプと非画面仕様を分離して確認します。</p>
        </div>
        <div class="layout-toolbar" data-layout-switcher>
          <button class="layout-chip active" type="button" data-layout-target="pc">PC</button>
          <button class="layout-chip" type="button" data-layout-target="smp">SMP</button>
        </div>
      </header>
      <div class="reload-error" data-reload-error hidden></div>
      <section class="explanation-panel" aria-label="仕様の説明">
        <div class="spec-context" id="spec-context">${slots.initialSummaryHtml}</div>
      </section>
      <section class="prototype-area" id="prototype-area" aria-label="UIプロトタイプ">
        ${slots.prototypeHtml}
      </section>
      <section class="non-ui-spec-area" id="non-ui-spec-area" aria-label="非画面仕様" hidden>
        ${slots.nonUiSpecHtml}
      </section>
    </main>
  </div>
  <script>
${slots.interactionScript}
  </script>
</body>
</html>`;
}
