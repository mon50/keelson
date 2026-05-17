import type { NonUiProjection } from './types';
import { assertSafeFragment, escapeHtml } from './utils';

export function renderNonUiSpecContent(items: NonUiProjection[]): string {
  const html =
    items.length === 0
      ? `<div class="view-panel" data-view="non-ui-empty" hidden><div class="surface"><p>非画面仕様は未定義です。</p></div></div>`
      : items.map(renderNonUiItem).join('\n');
  assertSafeFragment(html);
  return html;
}

export function renderNonUiItem(item: NonUiProjection): string {
  const html = `<div class="view-panel" data-view="${escapeHtml(item.id)}" hidden>
  <div class="surface non-ui-surface">
    <header class="surface-head">
      <p class="surface-kicker">非画面仕様</p>
      <h2>${escapeHtml(item.label)}</h2>
      <p>${escapeHtml(item.meta)}</p>
    </header>
    ${item.sections
      .map(
        (section) => `<section class="spec-check">
      <h3>${escapeHtml(section.title)}</h3>
      <p>${escapeHtml(section.description)}</p>
      <ul class="spec-check-list">
        ${section.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')}
      </ul>
    </section>`
      )
      .join('')}
  </div>
</div>`;
  assertSafeFragment(html);
  return html;
}
