import { describe, expect, it } from 'vitest';
import { renderSpecProjection } from '../src/composer';
import { renderField } from '../src/field-renderer';
import { renderNonUiSpecContent } from '../src/non-ui-renderer';
import { projectSpec } from '../src/projector';
import { renderPrototypeAreaContent, renderUiView } from '../src/prototype-renderer';
import { renderShell } from '../src/template';
import type { NonUiProjection, ProjectedField, UiViewProjection } from '../src/types';
import { assertSafeFragment, escapeHtml } from '../src/utils';
import { commerceSpec, dailyReportSpec, noUiSpec } from './fixtures';

describe('HTML safety utilities', () => {
  it('escapes user-controlled strings', () => {
    expect(escapeHtml('<>&"\'')).toBe('&lt;&gt;&amp;&quot;&#39;');
  });

  it('rejects fragments with scripts, styles, or protected shell containers', () => {
    expect(() => assertSafeFragment('<script>alert(1)</script>')).toThrow(/script/i);
    expect(() => assertSafeFragment('<section id="prototype-area"></section>')).toThrow(
      /prototype-area/
    );
  });
});

describe('renderField', () => {
  const fields: ProjectedField[] = [
    { name: 'title', label: 'タイトル', type: 'string', required: true },
    { name: 'body', label: '本文', type: 'text', required: false },
    { name: 'hours', label: '時間', type: 'number', required: false },
    { name: 'date', label: '日付', type: 'date', required: false },
    { name: 'status', label: '状態', type: 'enum', required: false, options: ['draft', 'submitted'] },
    { name: 'done', label: '完了', type: 'boolean', required: false },
    { name: 'unknown', label: '未知', type: 'uuid', required: false }
  ];

  it('renders editable controls for known and unknown field types', () => {
    const html = fields.map((field) => renderField(field)).join('\n');

    expect(html).toContain('type="text"');
    expect(html).toContain('<textarea');
    expect(html).toContain('type="number"');
    expect(html).toContain('type="date"');
    expect(html).toContain('<select');
    expect(html).toContain('type="checkbox"');
    expect(html).not.toContain('disabled');
    expect(html).toContain('data-sync-field="unknown"');
  });

  it('adds required attribute when field.required is true', () => {
    const html = renderField({ name: 'name', label: '名前', type: 'string', required: true });
    expect(html).toContain('required');
  });
});

describe('shell and slot renderers', () => {
  const projection = projectSpec(dailyReportSpec());
  const uiItems = projection.items.filter((item): item is UiViewProjection => item.kind === 'ui');
  const nonUiItems = projection.items.filter(
    (item): item is NonUiProjection => item.kind === 'non-ui'
  );

  it('renderShell always owns stable DOM regions', () => {
    const html = renderShell({
      appName: 'App',
      appMeta: '確認UI',
      sidebarHtml: '<button class="nav-item" data-target="view-a">A</button>',
      initialSummaryHtml: '<article class="spec-fact">A</article>',
      prototypeHtml: '<div class="view-panel" data-view="view-a"></div>',
      nonUiSpecHtml: '<div class="view-panel" data-view="non-ui-a"></div>',
      interactionScript: 'window.__ok = true;'
    });

    expect(html).toContain('id="app-shell"');
    expect(html).toContain('id="spec-context"');
    expect(html).toContain('id="prototype-area"');
    expect(html).toContain('id="non-ui-spec-area"');
    expect(html).toContain('aria-label="Spec Preview"');
    expect(html).toContain('aria-label="非画面仕様"');
  });

  it('preview renderer returns only UI preview fragments', () => {
    const html = renderPrototypeAreaContent(uiItems, projection.layouts);

    expect(html).toContain('data-layout-panel="pc"');
    expect(html).toContain('data-layout-panel="smp"');
    expect(html).toContain('data-view="view-reportForm"');
    expect(html).not.toContain('id="prototype-area"');
    expect(html).not.toContain('non-ui-spec-area');
    expect(html).not.toContain('DB・バックエンド');
  });

  it('renders form viewType with <form> and field-grid', () => {
    const formItem = uiItems.find((item) => item.viewType === 'form')!;
    const html = renderUiView(formItem, 'pc');
    expect(html).toContain('<form');
    expect(html).toContain('field-grid');
    expect(html).toContain('product-frame');
    expect(html).toContain('USカバレッジ');
    expect(html).toContain('日報を提出');
  });

  it('renders list viewType with <table>', () => {
    const listItem = uiItems.find((item) => item.viewType === 'list')!;
    const html = renderUiView(listItem, 'pc');
    expect(html).toContain('<table');
  });

  it('renders commerce uiBlueprint as a marketplace-style product grid', () => {
    const commerceProjection = projectSpec(commerceSpec());
    const listItem = commerceProjection.items.find(
      (item): item is UiViewProjection => item.kind === 'ui' && item.id === 'view-productList'
    )!;
    const html = renderUiView(listItem, 'pc');

    expect(html).toContain('commerce-search');
    expect(html).toContain('filter-panel');
    expect(html).toContain('product-card');
    expect(html).toContain('cart-summary');
    expect(html).toContain('カートに入れる');
  });

  it('syncs commerce card titles to the selected title field', () => {
    const spec = commerceSpec();
    spec.views!.productList.fields = ['brand', 'price', 'productName', 'rating', 'delivery'];
    const commerceProjection = projectSpec(spec);
    const listItem = commerceProjection.items.find(
      (item): item is UiViewProjection => item.kind === 'ui' && item.id === 'view-productList'
    )!;
    const html = renderUiView(listItem, 'pc');

    expect(html).toContain('<h4 data-value-field="productName">');
    expect(html).not.toContain('<h4 data-value-field="brand">');
  });

  it('renders detail viewType with <dl>', () => {
    const detailItem = uiItems.find((item) => item.viewType === 'detail')!;
    const html = renderUiView(detailItem, 'pc');
    expect(html).toContain('<dl');
  });

  it('renders empty viewType with UIビュー未定義 message', () => {
    const emptyProjection = projectSpec(noUiSpec());
    const emptyItem = emptyProjection.items[0] as UiViewProjection;
    const html = renderUiView(emptyItem, 'pc');
    expect(html).toContain('UIビュー未定義');
  });

  it('wraps content in phone-frame for smp layout', () => {
    const formItem = uiItems.find((item) => item.viewType === 'form')!;
    const html = renderUiView(formItem, 'smp');
    expect(html).toContain('phone-frame');
  });

  it('non-UI renderer returns only non-screen specification fragments', () => {
    const html = renderNonUiSpecContent(nonUiItems);

    expect(html).toContain('data-view="non-ui-backend"');
    expect(html).toContain('spec-check-list');
    expect(html).not.toContain('id="non-ui-spec-area"');
    expect(html).not.toContain('<input');
    expect(html).not.toContain('layout-chip');
  });

  it('composer keeps UI and non-UI areas separated and deterministic', () => {
    const html = renderSpecProjection(projection);

    expect(html).toContain('日報入力');
    expect(html).toContain('担当者として、日報を短時間で提出したい');
    expect(html).toContain('DB・バックエンド');
    expect(html.indexOf('id="prototype-area"')).toBeLessThan(html.indexOf('id="non-ui-spec-area"'));
    expect(html).toBe(renderSpecProjection(projectSpec(dailyReportSpec())));
  });
});
