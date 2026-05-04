import type { SpecProjection } from './types';
import { jsonForScript } from './utils';

export function renderInteractionScript(projection: SpecProjection): string {
  const items = projection.items.map((item) => ({
    id: item.id,
    kind: item.kind,
    summary: item.summary,
    fields: item.kind === 'ui' ? item.fields : []
  }));

  return `(() => {
  const items = ${jsonForScript(items)};
  const byId = new Map(items.map((item) => [item.id, item]));
  const first = items[0];
  const state = {
    activeViewId: first ? first.id : '',
    activeLayout: 'pc',
    formState: {},
    submitted: false
  };

  for (const item of items) {
    for (const field of item.fields || []) {
      if (!(field.name in state.formState)) {
        state.formState[field.name] = field.sampleValue ?? (field.type === 'boolean' ? false : '');
      }
    }
  }

  const text = (value) => value == null ? '' : String(value);
  const display = (value) => value === true ? 'はい' : value === false ? 'いいえ' : text(value);
  const htmlEscape = (value) => text(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  function renderSpecSummary(viewId) {
    const item = byId.get(viewId);
    const target = document.getElementById('spec-context');
    if (!item || !target) return;
    target.innerHTML = item.summary.map((card) => \`
      <article class="spec-fact">
        <p>\${htmlEscape(card.kicker)}</p>
        <h3>\${htmlEscape(card.title)}</h3>
        <p>\${htmlEscape(card.description)}</p>
      </article>\`).join('');
  }

  function setActiveView(viewId) {
    const item = byId.get(viewId);
    if (!item) return;
    state.activeViewId = viewId;
    document.querySelectorAll('[data-target]').forEach((node) => {
      node.classList.toggle('active', node.getAttribute('data-target') === viewId);
    });
    document.querySelectorAll('[data-view]').forEach((node) => {
      node.hidden = node.getAttribute('data-view') !== viewId;
    });
    const prototypeArea = document.getElementById('prototype-area');
    const nonUiArea = document.getElementById('non-ui-spec-area');
    const layoutSwitcher = document.querySelector('[data-layout-switcher]');
    if (prototypeArea) prototypeArea.hidden = item.kind !== 'ui';
    if (nonUiArea) nonUiArea.hidden = item.kind !== 'non-ui';
    if (layoutSwitcher) layoutSwitcher.hidden = item.kind !== 'ui';
    renderSpecSummary(viewId);
    syncPreview();
  }

  function setActiveLayout(layout) {
    state.activeLayout = layout;
    document.querySelectorAll('[data-layout-target]').forEach((node) => {
      node.classList.toggle('active', node.getAttribute('data-layout-target') === layout);
    });
    document.querySelectorAll('[data-layout-panel]').forEach((node) => {
      node.hidden = node.getAttribute('data-layout-panel') !== layout;
    });
    setActiveView(state.activeViewId);
  }

  function updateStateFromControl(control) {
    const field = control.getAttribute('data-sync-field');
    if (!field) return;
    state.formState[field] = control.type === 'checkbox' ? control.checked : control.value;
    syncPreview(control);
  }

  function syncPreview(origin) {
    document.querySelectorAll('[data-sync-field]').forEach((control) => {
      const field = control.getAttribute('data-sync-field');
      if (!field || control === origin) return;
      const value = state.formState[field];
      if (control.type === 'checkbox') {
        control.checked = value === true;
      } else {
        control.value = text(value);
      }
    });
    document.querySelectorAll('[data-value-field]').forEach((node) => {
      const field = node.getAttribute('data-value-field');
      node.textContent = display(state.formState[field]);
    });
    document.querySelectorAll('[data-submitted-value]').forEach((node) => {
      node.textContent = state.submitted ? 'はい' : 'いいえ';
    });
    document.querySelectorAll('[data-feedback]').forEach((node) => {
      node.hidden = !state.submitted;
    });
  }

  function handleSubmit(event) {
    event.preventDefault();
    state.submitted = true;
    if ('status' in state.formState) state.formState.status = 'submitted';
    if ('submitted' in state.formState) state.formState.submitted = true;
    syncPreview();
  }

  function connectReloadStream() {
    if (!('EventSource' in window)) return;
    const errorBox = document.querySelector('[data-reload-error]');
    const stream = new EventSource('/reload-stream');
    stream.onmessage = (event) => {
      if (event.data === 'reload') {
        window.location.reload();
        return;
      }
      if (event.data.startsWith('error:') && errorBox) {
        errorBox.textContent = event.data.slice('error:'.length);
        errorBox.hidden = false;
      }
    };
  }

  document.querySelectorAll('[data-target]').forEach((node) => {
    node.addEventListener('click', () => setActiveView(node.getAttribute('data-target')));
  });
  document.querySelectorAll('[data-layout-target]').forEach((node) => {
    node.addEventListener('click', () => setActiveLayout(node.getAttribute('data-layout-target')));
  });
  document.querySelectorAll('[data-sync-field]').forEach((node) => {
    node.addEventListener('input', () => updateStateFromControl(node));
    node.addEventListener('change', () => updateStateFromControl(node));
  });
  document.querySelectorAll('[data-prototype-form]').forEach((node) => {
    node.addEventListener('submit', handleSubmit);
  });

  if (first) setActiveView(first.id);
  setActiveLayout('pc');
  connectReloadStream();
})();`;
}
