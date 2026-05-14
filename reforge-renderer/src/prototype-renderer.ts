import { renderField } from './field-renderer';
import type { LayoutKind, ProjectedField, UiViewProjection } from './types';
import { assertSafeFragment, escapeHtml, sanitizeId, toHumanLabel } from './utils';

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
      return renderList(view, layout);
    case 'detail':
      return renderDetail(view, layout);
    default:
      return renderEmptyView(view, layout);
  }
}

function renderForm(view: UiViewProjection, layout: LayoutKind): string {
  return renderProductFrame(
    view,
    layout,
    `<div class="prototype-canvas form-canvas">
  <form class="work-panel prototype-form" data-prototype-form data-view-id="${escapeHtml(view.id)}">
    <div class="panel-heading">
      <div>
        <p class="surface-kicker">入力ステップ</p>
        <h3>${escapeHtml(view.primaryActionLabel)}までの主要項目</h3>
      </div>
      <span class="quality-badge">${requiredCount(view.fields)}必須</span>
    </div>
    <div class="field-grid">
      ${view.fields.map((field) => renderField(field, { prefix: `${layout}-${view.id}-` })).join('')}
    </div>
    <div class="form-actions">
      <button class="secondary-action" type="button">${escapeHtml(view.secondaryActionLabel)}</button>
      <button class="primary-action" type="submit" data-submit-action>${escapeHtml(
        view.primaryActionLabel
      )}</button>
      <span class="success-feedback" data-feedback hidden>保存後の状態に反映しました</span>
    </div>
  </form>
  <aside class="support-stack">
    ${renderLivePreview(view)}
    ${renderRequirementRail(view)}
  </aside>
</div>`
  );
}

function renderList(view: UiViewProjection, layout: LayoutKind): string {
  if (isCommerceView(view)) {
    return renderCommerceList(view, layout);
  }

  return renderProductFrame(
    view,
    layout,
    `<div class="prototype-canvas list-canvas">
  <section class="work-panel list-surface">
    <div class="panel-heading">
      <div>
        <p class="surface-kicker">一覧ワークスペース</p>
        <h3>検索して、比較して、次の操作へ進む</h3>
      </div>
      <span class="quality-badge">${view.sampleRows.length}件表示</span>
    </div>
    <div class="command-bar">
      <input type="search" value="" placeholder="${escapeHtml(view.label)}を検索">
      <button class="secondary-action" type="button">${escapeHtml(view.secondaryActionLabel)}</button>
      <button class="primary-action" type="button">${escapeHtml(view.primaryActionLabel)}</button>
    </div>
    <table class="prototype-table">
      <thead><tr>${view.fields.map((field) => `<th>${escapeHtml(field.label)}</th>`).join('')}<th>状態</th></tr></thead>
      <tbody>${view.sampleRows.map((row, index) => renderListRow(view.fields, row, index)).join('')}</tbody>
    </table>
  </section>
  <aside class="support-stack">
    ${renderMetricPanel(view)}
    ${renderRequirementRail(view)}
  </aside>
</div>`
  );
}

function renderCommerceList(view: UiViewProjection, layout: LayoutKind): string {
  return renderProductFrame(
    view,
    layout,
    `<div class="prototype-canvas commerce-canvas">
  <section class="commerce-hero">
    <div>
      <p class="surface-kicker">マーケットプレイス検索</p>
      <h3>${escapeHtml(view.label)}</h3>
      <p>${escapeHtml(view.description)}</p>
    </div>
    <div class="commerce-search">
      <select aria-label="カテゴリ"><option>すべて</option><option>おすすめ</option></select>
      <input type="search" value="${escapeHtml(firstSearchValue(view))}" aria-label="検索" placeholder="商品を検索">
      <button class="primary-action" type="button">検索</button>
    </div>
  </section>
  <aside class="filter-panel">
    <p class="surface-kicker">絞り込み</p>
    ${renderCommerceFilter('配送', ['明日お届け', '送料無料', '本日発送'])}
    ${renderCommerceFilter('評価', ['4つ星以上', '3つ星以上'])}
    ${renderCommerceFilter('価格', ['5,000円未満', '5,000円〜15,000円', '15,000円以上'])}
  </aside>
  <section class="commerce-results">
    <div class="panel-heading">
      <div>
        <p class="surface-kicker">検索結果</p>
        <h3>比較しながら選べる商品カード</h3>
      </div>
      <span class="quality-badge">${view.sampleRows.length}件表示</span>
    </div>
    <div class="product-grid">
      ${view.sampleRows.map((row, index) => renderProductCard(view, row, index)).join('')}
    </div>
  </section>
  <aside class="support-stack commerce-side">
    ${renderCartSummary(view)}
    ${renderRequirementRail(view)}
  </aside>
</div>`
  );
}

function renderListRow(
  fields: ProjectedField[],
  row: Record<string, string | number | boolean>,
  rowIndex: number
): string {
  const cells = fields
    .map((field) => {
      const value = row[field.name] ?? field.sampleValue;
      if (rowIndex === 0) {
        return `<td><span data-value-field="${escapeHtml(field.name)}">${escapeHtml(displayValue(value))}</span></td>`;
      }
      return `<td>${escapeHtml(displayValue(value))}</td>`;
    })
    .join('');
  const status =
    rowIndex === 0
      ? '<span class="state-pill" data-submitted-value>いいえ</span>'
      : '<span class="state-pill muted">サンプル</span>';
  return `<tr>${cells}<td>${status}</td></tr>`;
}

function renderDetail(view: UiViewProjection, layout: LayoutKind): string {
  return renderProductFrame(
    view,
    layout,
    `<div class="prototype-canvas detail-canvas">
  <section class="work-panel detail-surface">
    <div class="panel-heading">
      <div>
        <p class="surface-kicker">詳細ビュー</p>
        <h3>判断に必要な情報を1画面で確認</h3>
      </div>
      <button class="primary-action" type="button">${escapeHtml(view.primaryActionLabel)}</button>
    </div>
    <dl class="detail-list">
      ${view.fields.map(renderDetailRow).join('')}
      <div><dt>保存状態</dt><dd><span class="state-pill" data-submitted-value>いいえ</span></dd></div>
    </dl>
  </section>
  <aside class="support-stack">
    ${renderActivityPanel(view)}
    ${renderRequirementRail(view)}
  </aside>
</div>`
  );
}

function renderDetailRow(field: ProjectedField): string {
  return `<div><dt>${escapeHtml(field.label)}</dt><dd data-value-field="${escapeHtml(
    field.name
  )}">${escapeHtml(displayValue(field.sampleValue))}</dd></div>`;
}

function renderEmptyView(view: UiViewProjection, layout: LayoutKind): string {
  return renderProductFrame(
    view,
    layout,
    `<div class="prototype-canvas empty-canvas">
  <section class="work-panel empty-surface">
    <p class="surface-kicker">UIビュー未定義</p>
    <h3>仕様に画面テンプレートを追加すると、ここに操作可能な Spec Preview が表示されます。</h3>
    <p>最低限、views に form/list/detail のいずれか、entity、fields を定義してください。</p>
  </section>
  <aside class="support-stack">${renderRequirementRail(view)}</aside>
</div>`
  );
}

function renderProductFrame(view: UiViewProjection, layout: LayoutKind, content: string): string {
  const html = `<article class="product-frame template-${escapeHtml(sanitizeId(view.template))} density-${escapeHtml(
    sanitizeId(view.density)
  )} layout-${layout}"${renderTokenStyle(view)}>
  ${isCommerceView(view) ? renderCommerceNav(view) : renderStandardNav(view)}
  <section class="product-main">
    <header class="product-header">
      <div>
        <p class="screen-kicker">${escapeHtml(viewTypeLabel(view.viewType))} / ${escapeHtml(
    toHumanLabel(view.template)
  )}</p>
        <h2>${escapeHtml(view.label)}</h2>
        <p>${escapeHtml(view.description)}</p>
      </div>
      <div class="screen-actions">
        <button class="secondary-action" type="button">${escapeHtml(view.secondaryActionLabel)}</button>
        <button class="primary-action" type="button">${escapeHtml(view.primaryActionLabel)}</button>
      </div>
    </header>
    ${content}
  </section>
</article>`;
  assertSafeFragment(html);
  return html;
}

function renderStandardNav(view: UiViewProjection): string {
  return `<aside class="product-nav" aria-label="Spec Preview 内ナビゲーション">
    <div class="product-brand">
      <span class="product-logo">${escapeHtml(initials(view.entityName || view.label))}</span>
      <div>
        <p class="product-brand-name">${escapeHtml(toHumanLabel(view.entityName || view.label))}</p>
        <p class="product-brand-meta">Spec Preview</p>
      </div>
    </div>
    <div class="product-nav-links">
      <span class="product-link active">現在の画面</span>
      <span class="product-link">分析</span>
      <span class="product-link">設定</span>
    </div>
  </aside>`;
}

function renderCommerceNav(view: UiViewProjection): string {
  return `<aside class="product-nav commerce-nav" aria-label="マーケットプレイスナビゲーション">
    <div class="product-brand">
      <span class="product-logo">${escapeHtml(initials(view.entityName || view.label))}</span>
      <div>
        <p class="product-brand-name">${escapeHtml(toHumanLabel(view.entityName || view.label))}</p>
        <p class="product-brand-meta">Marketplace</p>
      </div>
    </div>
    <div class="product-nav-links">
      <span class="product-link active">検索</span>
      <span class="product-link">ランキング</span>
      <span class="product-link">注文履歴</span>
      <span class="product-link">カート</span>
    </div>
  </aside>`;
}

function renderLivePreview(view: UiViewProjection): string {
  return `<section class="insight-panel live-preview">
  <p class="surface-kicker">ライブプレビュー</p>
  <h3>${escapeHtml(toHumanLabel(view.entityName || view.label))}</h3>
  <dl class="preview-list">
    ${view.fields.slice(0, 5).map(renderPreviewRow).join('')}
  </dl>
  <div class="preview-status">
    <span>保存状態</span>
    <strong data-submitted-value>いいえ</strong>
  </div>
</section>`;
}

function renderPreviewRow(field: ProjectedField): string {
  return `<div><dt>${escapeHtml(field.label)}</dt><dd data-value-field="${escapeHtml(
    field.name
  )}">${escapeHtml(displayValue(field.sampleValue))}</dd></div>`;
}

function renderMetricPanel(view: UiViewProjection): string {
  return `<section class="insight-panel metric-panel">
  <p class="surface-kicker">確認メトリクス</p>
  <div class="metric-grid">
    <div><strong>${view.fields.length}</strong><span>表示項目</span></div>
    <div><strong>${requiredCount(view.fields)}</strong><span>必須項目</span></div>
    <div><strong>${view.requirements.length}</strong><span>US</span></div>
  </div>
</section>`;
}

function renderCommerceFilter(title: string, items: string[]): string {
  return `<div class="filter-group">
  <h4>${escapeHtml(title)}</h4>
  ${items.map((item, index) => `<label><input type="checkbox"${index === 0 ? ' checked' : ''}> ${escapeHtml(item)}</label>`).join('')}
</div>`;
}

function renderProductCard(
  view: UiViewProjection,
  row: Record<string, string | number | boolean>,
  rowIndex: number
): string {
  const titleHints = ['product', 'item', '商品', '製品', 'title', 'name'];
  const titleField = fieldByHint(view, titleHints);
  const title = valueByHint(view, row, titleHints, rowIndex);
  const brand = valueByHint(view, row, ['brand', 'maker', 'ブランド', 'メーカー'], rowIndex);
  const price = valueByHint(view, row, ['price', 'amount', 'cost', '金額', '価格'], rowIndex);
  const rating = valueByHint(view, row, ['rating', '評価'], rowIndex);
  const delivery = valueByHint(view, row, ['delivery', 'shipping', '配送', '納期'], rowIndex);
  const syncAttr = rowIndex === 0 && titleField ? ` data-value-field="${escapeHtml(titleField.name)}"` : '';
  return `<article class="product-card">
  <div class="product-thumb"><span>${escapeHtml(initials(title))}</span></div>
  <div class="product-copy">
    <p class="product-card-brand">${escapeHtml(brand)}</p>
    <h4${syncAttr}>${escapeHtml(title)}</h4>
    <div class="rating-row"><span aria-hidden="true">★★★★★</span><strong>${escapeHtml(rating)}</strong></div>
    <p class="price-line">${escapeHtml(price)}</p>
    <p class="delivery-line">${escapeHtml(delivery)}</p>
    <div class="card-actions">
      <button class="primary-action" type="button">${escapeHtml(view.primaryActionLabel)}</button>
      <button class="secondary-action" type="button">詳細</button>
    </div>
  </div>
</article>`;
}

function renderCartSummary(view: UiViewProjection): string {
  return `<section class="insight-panel cart-summary">
  <p class="surface-kicker">カート状態</p>
  <h3>${escapeHtml(view.primaryActionLabel)}後の変化</h3>
  <div class="preview-status">
    <span>追加済み</span>
    <strong data-submitted-value>いいえ</strong>
  </div>
  <p class="cart-note">${escapeHtml(view.states.length > 0 ? `${view.states.join(' / ')} を確認できます。` : '選択、追加、空状態を確認します。')}</p>
</section>`;
}

function renderActivityPanel(view: UiViewProjection): string {
  const primary = view.fields[0];
  const secondary = view.fields[1] ?? primary;
  return `<section class="insight-panel activity-panel">
  <p class="surface-kicker">状態と履歴</p>
  <ol class="activity-list">
    <li><span>作成</span><p>${escapeHtml(primary ? displayValue(primary.sampleValue) : view.label)}</p></li>
    <li><span>更新</span><p>${escapeHtml(secondary ? displayValue(secondary.sampleValue) : view.description)}</p></li>
    <li><span>次の操作</span><p>${escapeHtml(view.primaryActionLabel)}を実行できます。</p></li>
  </ol>
</section>`;
}

function renderRequirementRail(view: UiViewProjection): string {
  const requirements =
    view.requirements.length > 0
      ? view.requirements
      : ['この画面で満たすユーザーストーリーがまだ仕様化されていません。'];
  return `<section class="insight-panel requirement-rail">
  <p class="surface-kicker">USカバレッジ</p>
  <ul class="requirement-list">
    ${requirements.map((requirement) => `<li><span></span><p>${escapeHtml(requirement)}</p></li>`).join('')}
  </ul>
</section>`;
}

function requiredCount(fields: ProjectedField[]): number {
  return fields.filter((field) => field.required).length;
}

function isCommerceView(view: UiViewProjection): boolean {
  const key = `${view.template} ${view.designIntent} ${view.layout.shell ?? ''} ${view.layout.main ?? ''} ${view.components.join(
    ' '
  )} ${view.visualReferences.join(' ')}`.toLowerCase();
  return /commerce|marketplace|product|商品|ec|ecommerce|amazon|楽天|shop|cart|price|rating/.test(key);
}

function firstSearchValue(view: UiViewProjection): string {
  const field = view.fields.find((item) => /product|item|商品|製品|title|name/i.test(`${item.name} ${item.label}`));
  return field ? displayValue(field.sampleValue) : '';
}

function valueByHint(
  view: UiViewProjection,
  row: Record<string, string | number | boolean>,
  hints: string[],
  rowIndex: number
): string {
  const field = fieldByHint(view, hints);
  if (field) {
    const value = row[field.name] ?? field.sampleValue;
    if (/price|amount|cost|金額|価格/.test(hints.join(' ')) && typeof value === 'number') {
      return `${value.toLocaleString('ja-JP')}円`;
    }
    return displayValue(value);
  }
  const fallbacks = {
    title: ['ワイヤレスイヤホン Pro', '軽量バックパック', 'スマートLEDライト'],
    brand: ['Northstar', 'Kite Lab', 'Hikari Works'],
    price: ['12,800円', '8,400円', '19,600円'],
    rating: ['4.5', '4.2', '4.8'],
    delivery: ['明日お届け', '通常配送無料', '本日中に発送']
  };
  const hintKey = hints.join(' ');
  if (/price|amount|cost|金額|価格/.test(hintKey)) {
    return fallbacks.price[rowIndex] ?? fallbacks.price[0];
  }
  if (/brand|maker|ブランド|メーカー/.test(hintKey)) {
    return fallbacks.brand[rowIndex] ?? fallbacks.brand[0];
  }
  if (/rating|評価/.test(hintKey)) {
    return fallbacks.rating[rowIndex] ?? fallbacks.rating[0];
  }
  if (/delivery|shipping|配送|納期/.test(hintKey)) {
    return fallbacks.delivery[rowIndex] ?? fallbacks.delivery[0];
  }
  return fallbacks.title[rowIndex] ?? fallbacks.title[0];
}

function fieldByHint(view: UiViewProjection, hints: string[]): ProjectedField | undefined {
  return view.fields.find((item) => {
    const key = `${item.name} ${item.label}`.toLowerCase();
    return hints.some((hint) => key.includes(hint.toLowerCase()));
  });
}

function renderTokenStyle(view: UiViewProjection): string {
  const entries = [
    ['--prototype-accent', safeColor(view.tokens.accentColor)],
    ['--prototype-surface', safeColor(view.tokens.surfaceColor)],
    ['--prototype-text', safeColor(view.tokens.textColor)],
    ['--prototype-radius', safeRadius(view.tokens.borderRadius)]
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));
  if (entries.length === 0) {
    return '';
  }
  return ` style="${entries.map(([name, value]) => `${name}:${escapeHtml(value)}`).join(';')}"`;
}

function safeColor(value: unknown): string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(value) ? value : '';
}

function safeRadius(value: unknown): string {
  return typeof value === 'string' && /^\d{1,2}px$/.test(value) ? value : '';
}

function initials(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9ぁ-んァ-ヶ一-龠]/g, '')
    .slice(0, 2)
    .toUpperCase() || 'UI';
}

function viewTypeLabel(viewType: UiViewProjection['viewType']): string {
  switch (viewType) {
    case 'form':
      return '入力画面';
    case 'list':
      return '一覧画面';
    case 'detail':
      return '詳細画面';
    default:
      return 'Spec Preview';
  }
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
