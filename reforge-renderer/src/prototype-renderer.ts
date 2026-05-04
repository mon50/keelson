import { renderField } from './field-renderer';
import type { LayoutKind, ProjectedField, UiViewProjection } from './types';
import { assertSafeFragment, escapeHtml } from './utils';

export function renderPrototypeAreaContent(items: UiViewProjection[], layouts: LayoutKind[]): string {
  const html = layouts
    .map(
      (layout) => `<div class="layout-preview" data-layout-panel="${layout}"${
        layout !== 'pc' ? ' hidden' : ''
      }>
  ${items.map((item) => renderUiView(item, layout)).join('\n')}
</div>`
    )
    .join('\n');
  assertSafeFragment(html);
  return html;
}

export function renderUiView(view: UiViewProjection, layout: LayoutKind): string {
  const content = renderViewSurface(view, layout);
  const framed =
    layout === 'smp'
      ? `<div class="phone-frame"><div class="mobile-panel">${content}</div></div>`
      : content;
  const html = `<div class="view-panel" data-view="${escapeHtml(view.id)}"${
    view.viewType === 'empty' ? '' : ' hidden'
  }>${framed}</div>`;
  assertSafeFragment(html);
  return html;
}

function renderViewSurface(view: UiViewProjection, layout: LayoutKind): string {
  switch (view.viewType) {
    case 'form':
      return renderForm(view, layout);
    case 'list':
      return renderList(view);
    case 'detail':
      return renderDetail(view);
    default:
      return `<div class="surface empty-surface">
        <p class="surface-kicker">UIプロトタイプ</p>
        <h2>UIビュー未定義</h2>
        <p>入力・一覧・詳細のUIビューが仕様に定義されると、ここにプロトタイプが表示されます。</p>
      </div>`;
  }
}

function renderForm(view: UiViewProjection, layout: LayoutKind): string {
  return `<form class="surface prototype-form" data-prototype-form data-view-id="${escapeHtml(
    view.id
  )}">
  <header class="surface-head">
    <p class="surface-kicker">UIプロトタイプ</p>
    <h2>${escapeHtml(view.label)}</h2>
    <p>${escapeHtml(view.meta)}</p>
  </header>
  <div class="field-grid">
    ${view.fields.map((field) => renderField(field, { prefix: `${layout}-${view.id}-` })).join('')}
  </div>
  <div class="form-actions">
    <button class="primary-action" type="submit" data-submit-action>提出する</button>
    <span class="success-feedback" data-feedback hidden>提出が完了しました</span>
  </div>
</form>`;
}

function renderList(view: UiViewProjection): string {
  return `<div class="surface list-surface">
  <header class="surface-head">
    <p class="surface-kicker">UIプロトタイプ</p>
    <h2>${escapeHtml(view.label)}</h2>
    <p>提出後のブラウザ内状態を一覧で確認します。</p>
  </header>
  <table class="prototype-table">
    <thead><tr>${view.fields.map((field) => `<th>${escapeHtml(field.label)}</th>`).join('')}<th>提出済み</th></tr></thead>
    <tbody><tr>${view.fields.map(renderListCell).join('')}<td data-submitted-value>いいえ</td></tr></tbody>
  </table>
</div>`;
}

function renderListCell(field: ProjectedField): string {
  return `<td data-value-field="${escapeHtml(field.name)}">${escapeHtml(displayValue(field.sampleValue))}</td>`;
}

function renderDetail(view: UiViewProjection): string {
  return `<div class="surface detail-surface">
  <header class="surface-head">
    <p class="surface-kicker">UIプロトタイプ</p>
    <h2>${escapeHtml(view.label)}</h2>
    <p>提出後のブラウザ内状態を詳細で確認します。</p>
  </header>
  <dl class="detail-list">
    ${view.fields.map(renderDetailRow).join('')}
    <div><dt>提出済み</dt><dd data-submitted-value>いいえ</dd></div>
  </dl>
</div>`;
}

function renderDetailRow(field: ProjectedField): string {
  return `<div><dt>${escapeHtml(field.label)}</dt><dd data-value-field="${escapeHtml(
    field.name
  )}">${escapeHtml(displayValue(field.sampleValue))}</dd></div>`;
}

function displayValue(value: unknown): string {
  if (value === true) {
    return 'はい';
  }
  if (value === false) {
    return 'いいえ';
  }
  return String(value ?? '');
}
