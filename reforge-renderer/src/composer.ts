import { renderInteractionScript } from './interaction';
import { renderNonUiSpecContent } from './non-ui-renderer';
import { renderPrototypeAreaContent } from './prototype-renderer';
import { renderShell } from './template';
import type { ConfirmationItem, NonUiProjection, SpecProjection, UiViewProjection } from './types';
import { assertSafeFragment, escapeHtml } from './utils';

export function renderSpecProjection(projection: SpecProjection): string {
  const uiItems = projection.items.filter((item): item is UiViewProjection => item.kind === 'ui');
  const nonUiItems = projection.items.filter(
    (item): item is NonUiProjection => item.kind === 'non-ui'
  );
  const initialItem = projection.items[0];

  return renderShell({
    appName: projection.appName,
    appMeta: projection.version ? `version ${projection.version}` : '確認UI',
    sidebarHtml: renderSidebar(projection.items),
    initialSummaryHtml: initialItem ? renderInitialSummary(initialItem) : '',
    prototypeHtml: renderPrototypeAreaContent(uiItems, projection.layouts),
    nonUiSpecHtml: renderNonUiSpecContent(nonUiItems),
    interactionScript: renderInteractionScript(projection)
  });
}

export function renderSidebar(items: ConfirmationItem[]): string {
  const html = items
    .map(
      (item, index) => `<button class="nav-item${index === 0 ? ' active' : ''}" type="button" data-target="${escapeHtml(
        item.id
      )}">
  <span class="nav-icon" aria-hidden="true">${escapeHtml(item.icon)}</span>
  <span class="nav-copy">
    <span class="nav-title">${escapeHtml(item.label)}</span>
    <span class="nav-meta">${escapeHtml(item.meta)}</span>
  </span>
</button>`
    )
    .join('\n');
  assertSafeFragment(html);
  return html;
}

export function renderInitialSummary(item: ConfirmationItem): string {
  const html = item.summary
    .map(
      (summary) => `<article class="spec-fact">
  <p>${escapeHtml(summary.kicker)}</p>
  <h3>${escapeHtml(summary.title)}</h3>
  <p>${escapeHtml(summary.description)}</p>
</article>`
    )
    .join('\n');
  assertSafeFragment(html);
  return html;
}
