import type { ShellSlots } from './types';
import { escapeHtml } from './utils';

export function renderShell(slots: ShellSlots): string {
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(slots.appName)} Spec Preview</title>
  <style>
    :root { color-scheme: light; --bg:#f4f6f8; --panel:#fff; --panel-strong:#f9fbfc; --soft:#eef5f3; --line:#d7dde3; --text:#1f2933; --muted:#647181; --accent:#0f766e; --accent-strong:#0b524d; --blue:#295bdb; --amber:#9b5b00; --danger:#a13636; --shadow:0 18px 48px rgba(31,41,51,.08); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; min-width: 320px; background: var(--bg); color: var(--text); letter-spacing: 0; }
    button, input, select, textarea { font: inherit; letter-spacing: 0; }
    button { cursor: pointer; }
    .app-shell { min-height: 100vh; display: grid; grid-template-columns: 260px minmax(0, 1fr); }
    .sidebar { border-right: 1px solid var(--line); background: #fbfcfd; padding: 20px 16px; display: flex; flex-direction: column; gap: 20px; }
    .brand-title { margin: 0; font-size: 16px; line-height: 1.3; font-weight: 760; }
    .brand-subtitle, .section-label, .nav-meta, .surface-head p, .spec-fact p, .product-brand-meta, .product-header p, .panel-heading p, .preview-list dt, .detail-list dt, .requirement-list p, .activity-list span, .metric-grid span { color: var(--muted); }
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
    .product-frame { --prototype-accent: var(--accent); --prototype-surface: var(--panel); --prototype-text: var(--text); --prototype-radius: 8px; min-height: 640px; display: grid; grid-template-columns: 188px minmax(0, 1fr); background: #edf1f4; border: 1px solid #cfd7df; border-radius: var(--prototype-radius); overflow: hidden; box-shadow: var(--shadow); color: var(--prototype-text); }
    .product-nav { background: #202936; color: #f7fafc; padding: 18px 14px; display: flex; flex-direction: column; gap: 24px; }
    .product-brand { display: flex; align-items: center; gap: 10px; min-width: 0; }
    .product-logo { width: 34px; height: 34px; border-radius: 8px; background: #f0b429; color: #18202b; display: grid; place-items: center; font-size: 12px; font-weight: 820; flex: 0 0 auto; }
    .product-brand-name, .product-brand-meta, .screen-kicker, .surface-kicker, .panel-heading h3, .product-header h2, .preview-list, .detail-list, .requirement-list, .activity-list { margin: 0; }
    .product-brand-name { font-size: 13px; line-height: 1.25; font-weight: 760; overflow-wrap: anywhere; }
    .product-brand-meta { color: #a9b5c3; font-size: 11px; margin-top: 2px; }
    .product-nav-links { display: grid; gap: 6px; }
    .product-link { border-radius: 7px; padding: 8px 9px; color: #c6d0dc; font-size: 12px; font-weight: 680; }
    .product-link.active { background: rgba(255,255,255,.1); color: #fff; }
    .product-main { min-width: 0; display: grid; grid-template-rows: auto minmax(0, 1fr); background: #f7f9fb; }
    .product-header { display: flex; justify-content: space-between; gap: 14px; align-items: flex-start; padding: 22px 24px; border-bottom: 1px solid var(--line); background: linear-gradient(180deg, #fff, #f8fafc); }
    .product-header h2 { font-size: 24px; line-height: 1.2; margin-top: 5px; }
    .product-header p { max-width: 760px; line-height: 1.55; margin-top: 8px; }
    .screen-kicker, .surface-kicker { color: var(--prototype-accent); font-size: 11px; font-weight: 820; text-transform: uppercase; }
    .screen-actions, .form-actions, .command-bar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .screen-actions { justify-content: flex-end; }
    .prototype-canvas { min-width: 0; display: grid; gap: 14px; padding: 18px; align-content: start; }
    .form-canvas, .list-canvas, .detail-canvas { grid-template-columns: minmax(0, 1fr) minmax(250px, 32%); }
    .empty-canvas { grid-template-columns: minmax(0, 1fr) 280px; }
    .work-panel, .insight-panel { background: var(--prototype-surface); border: 1px solid var(--line); border-radius: var(--prototype-radius); padding: 16px; }
    .work-panel { min-width: 0; }
    .support-stack { display: grid; gap: 12px; align-content: start; min-width: 0; }
    .panel-heading { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; margin-bottom: 14px; }
    .panel-heading h3, .insight-panel h3, .empty-surface h3 { font-size: 16px; line-height: 1.35; margin-top: 4px; }
    .quality-badge, .state-pill { display: inline-flex; align-items: center; justify-content: center; min-height: 24px; border-radius: 999px; padding: 3px 9px; background: #e8f3ff; color: var(--blue); font-size: 12px; font-weight: 760; white-space: nowrap; }
    .state-pill { background: #edf7f5; color: var(--accent-strong); }
    .state-pill.muted { background: #eef1f4; color: var(--muted); }
    .field-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-top: 14px; }
    .field-control { display: grid; gap: 6px; }
    .field-label { font-size: 12px; font-weight: 720; }
    input, select, textarea { width: 100%; border: 1px solid var(--line); border-radius: 8px; padding: 9px 10px; background: #fff; color: var(--text); }
    input:focus, select:focus, textarea:focus { outline: 2px solid rgba(41,91,219,.22); border-color: var(--blue); }
    .form-actions { margin-top: 16px; }
    .primary-action, .secondary-action { border-radius: 8px; padding: 10px 14px; font-weight: 740; min-height: 38px; }
    .primary-action { border: 0; background: var(--prototype-accent); color: #fff; }
    .secondary-action { border: 1px solid var(--line); background: #fff; color: var(--text); }
    .success-feedback { color: var(--accent); font-weight: 720; }
    .prototype-table { width: 100%; border-collapse: collapse; margin-top: 12px; table-layout: fixed; }
    .prototype-table th, .prototype-table td { border-bottom: 1px solid var(--line); padding: 11px 8px; text-align: left; vertical-align: top; overflow-wrap: anywhere; }
    .prototype-table th { color: var(--muted); font-size: 12px; font-weight: 760; background: var(--panel-strong); }
    .preview-list, .detail-list { display: grid; gap: 8px; }
    .preview-list div, .detail-list div { display: grid; grid-template-columns: minmax(90px, 34%) minmax(0,1fr); gap: 10px; border-bottom: 1px solid var(--line); padding: 8px 0; }
    .preview-list dd, .detail-list dd { margin: 0; overflow-wrap: anywhere; }
    .preview-status { margin-top: 14px; padding: 12px; border-radius: 8px; background: #f4f8f6; display: flex; justify-content: space-between; gap: 10px; }
    .metric-grid { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 8px; margin-top: 10px; }
    .metric-grid div { background: var(--panel-strong); border: 1px solid var(--line); border-radius: 8px; padding: 10px; }
    .metric-grid strong { display: block; font-size: 22px; line-height: 1.1; }
    .metric-grid span { display: block; font-size: 11px; margin-top: 4px; }
    .requirement-list { list-style: none; display: grid; gap: 9px; padding: 0; margin-top: 12px; }
    .requirement-list li { display: grid; grid-template-columns: 16px minmax(0,1fr); gap: 8px; align-items: start; }
    .requirement-list li span { width: 16px; height: 16px; border-radius: 50%; background: #eaf7ef; border: 1px solid #9bd3ac; margin-top: 2px; }
    .requirement-list p { line-height: 1.45; }
    .activity-list { padding-left: 18px; display: grid; gap: 10px; }
    .activity-list p { margin: 3px 0 0; line-height: 1.45; }
    .density-high .prototype-canvas { gap: 10px; padding: 12px; }
    .density-high .work-panel, .density-high .insight-panel { padding: 12px; }
    .density-spacious .prototype-canvas { gap: 18px; padding: 24px; }
    .commerce-canvas { grid-template-columns: 220px minmax(0, 1fr) minmax(240px, 28%); grid-template-areas: "hero hero hero" "filter results side"; align-items: start; }
    .commerce-hero { grid-area: hero; background: #fff; border: 1px solid var(--line); border-radius: var(--prototype-radius); padding: 14px; display: grid; grid-template-columns: minmax(220px, .8fr) minmax(320px, 1.2fr); gap: 14px; align-items: end; }
    .commerce-hero h3 { margin: 4px 0 0; font-size: 20px; line-height: 1.25; }
    .commerce-hero p { margin: 6px 0 0; color: var(--muted); line-height: 1.45; }
    .commerce-search { display: grid; grid-template-columns: 130px minmax(0, 1fr) auto; gap: 8px; }
    .filter-panel { grid-area: filter; background: #fff; border: 1px solid var(--line); border-radius: var(--prototype-radius); padding: 14px; display: grid; gap: 14px; }
    .filter-group { display: grid; gap: 7px; border-top: 1px solid var(--line); padding-top: 12px; }
    .filter-group h4 { margin: 0; font-size: 13px; }
    .filter-group label { display: flex; align-items: center; gap: 7px; color: var(--text); font-size: 12px; line-height: 1.35; }
    .filter-group input { width: auto; }
    .commerce-results { grid-area: results; min-width: 0; background: #fff; border: 1px solid var(--line); border-radius: var(--prototype-radius); padding: 14px; }
    .commerce-side { grid-area: side; }
    .product-grid { display: grid; gap: 10px; }
    .product-card { display: grid; grid-template-columns: 118px minmax(0, 1fr); gap: 12px; border: 1px solid var(--line); border-radius: var(--prototype-radius); background: #fff; padding: 12px; }
    .product-thumb { min-height: 118px; border-radius: 8px; background: linear-gradient(135deg, #f7f0db, #e6edf7); display: grid; place-items: center; color: #4b5563; font-weight: 820; }
    .product-thumb span { width: 46px; height: 46px; border-radius: 50%; background: rgba(255,255,255,.75); display: grid; place-items: center; }
    .product-copy { min-width: 0; display: grid; gap: 6px; align-content: start; }
    .product-card-brand, .delivery-line, .cart-note { margin: 0; color: var(--muted); font-size: 12px; line-height: 1.45; }
    .product-card h4 { margin: 0; font-size: 15px; line-height: 1.35; overflow-wrap: anywhere; }
    .rating-row { display: flex; align-items: center; gap: 7px; color: #d97706; font-size: 12px; }
    .rating-row strong { color: var(--text); }
    .price-line { margin: 0; font-size: 18px; font-weight: 820; }
    .card-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
    .detail-list { display: grid; gap: 8px; margin: 12px 0 0; }
    .phone-frame { max-width: 390px; border: 10px solid #20242a; border-radius: 28px; background: #20242a; margin: 0 auto; }
    .mobile-panel { border-radius: 18px; overflow: hidden; background: var(--bg); }
    .layout-smp.product-frame, .mobile-panel .product-frame { min-height: 720px; grid-template-columns: 1fr; }
    .layout-smp .product-nav, .mobile-panel .product-nav { display: none; }
    .layout-smp .product-header, .mobile-panel .product-header { display: grid; padding: 18px; }
    .layout-smp .screen-actions, .mobile-panel .screen-actions { justify-content: stretch; }
    .layout-smp .screen-actions button, .mobile-panel .screen-actions button { flex: 1; }
    .layout-smp .prototype-canvas, .mobile-panel .prototype-canvas { grid-template-columns: 1fr; padding: 12px; }
    .layout-smp .commerce-canvas, .mobile-panel .commerce-canvas { grid-template-areas: "hero" "filter" "results" "side"; }
    .layout-smp .commerce-hero, .mobile-panel .commerce-hero { grid-template-columns: 1fr; }
    .layout-smp .commerce-search, .mobile-panel .commerce-search { grid-template-columns: 1fr; }
    .layout-smp .product-card, .mobile-panel .product-card { grid-template-columns: 88px minmax(0, 1fr); }
    .layout-smp .product-thumb, .mobile-panel .product-thumb { min-height: 88px; }
    .layout-smp .field-grid, .mobile-panel .field-grid { grid-template-columns: 1fr; }
    .layout-smp .prototype-table, .mobile-panel .prototype-table { font-size: 12px; }
    .spec-check-list { margin: 10px 0 0; padding-left: 18px; line-height: 1.6; }
    @media (max-width: 1120px) { .commerce-canvas { grid-template-columns: 200px minmax(0, 1fr); grid-template-areas: "hero hero" "filter results" "side side"; } }
    @media (max-width: 980px) { .form-canvas, .list-canvas, .detail-canvas, .empty-canvas { grid-template-columns: 1fr; } .product-frame { grid-template-columns: 1fr; } .product-nav { display: none; } .commerce-canvas { grid-template-columns: 1fr; grid-template-areas: "hero" "filter" "results" "side"; } .commerce-hero { grid-template-columns: 1fr; } }
    @media (max-width: 760px) { .app-shell { grid-template-columns: 1fr; } .sidebar { border-right: 0; border-bottom: 1px solid var(--line); } .main { padding: 16px; } .topbar { align-items: flex-start; flex-direction: column; } .product-header { display: grid; } .screen-actions button { flex: 1; } }
  </style>
</head>
<body>
  <div class="app-shell" id="app-shell">
    <aside class="sidebar" aria-label="Spec Preview 確認項目">
      <div class="brand">
        <p class="brand-title">${escapeHtml(slots.appName)}</p>
        <p class="brand-subtitle">${escapeHtml(slots.appMeta)}</p>
      </div>
      <nav class="side-section" aria-label="Spec Preview">
        <span class="section-label">Spec Preview</span>
        <div class="nav-list">
          ${slots.sidebarHtml}
        </div>
      </nav>
    </aside>
    <main class="main">
      <header class="topbar">
        <div>
          <h1>Spec Preview</h1>
          <p class="brand-subtitle">spec.json から生成した確認ビューです。固定UIは Prototype Artifact として別管理します。</p>
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
      <section class="prototype-area" id="prototype-area" aria-label="Spec Preview">
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
