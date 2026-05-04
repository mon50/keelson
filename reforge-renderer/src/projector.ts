import type {
  FieldDef,
  NonUiProjection,
  NonUiSection,
  ProjectedField,
  ReforgeSpec,
  SpecProjection,
  SpecSummaryCard,
  UiViewProjection,
  UiViewType,
  ViewDef
} from './types';
import { sanitizeId, stableKeys, stableStringify, toHumanLabel } from './utils';

const UI_VIEW_TYPES = new Set(['form', 'list', 'detail']);
const KNOWN_TOP_LEVEL = new Set([
  'meta',
  'entities',
  'views',
  'database',
  'backend',
  'logic',
  'flows'
]);

export function projectSpec(spec: ReforgeSpec): SpecProjection {
  const uiItems = projectUiItems(spec);
  const items = [...uiItems, ...projectNonUiItems(spec)];

  if (uiItems.length === 0) {
    items.unshift(createEmptyUiItem(spec));
  }

  return {
    appName: spec.meta?.name || 'Reforge Preview',
    version: spec.meta?.version,
    lang: spec.meta?.lang,
    items,
    layouts: ['pc', 'smp']
  };
}

function projectUiItems(spec: ReforgeSpec): UiViewProjection[] {
  const views = spec.views ?? {};
  return stableKeys(views)
    .map((viewName) => [viewName, views[viewName]] as const)
    .filter(([, view]) => view && UI_VIEW_TYPES.has(String(view.type)))
    .sort(([leftName, leftView], [rightName, rightView]) => {
      const priority = (view: ViewDef): number => {
        switch (view.type) {
          case 'form':
            return 1;
          case 'list':
            return 2;
          case 'detail':
            return 3;
          default:
            return 4;
        }
      };
      return priority(leftView) - priority(rightView) || leftName.localeCompare(rightName, 'en');
    })
    .map(([viewName, view]) => {
      const viewType = view.type as UiViewType;
      const fields = projectFields(spec, view);
      const id = `view-${sanitizeId(viewName)}`;
      const label = view.title || defaultViewLabel(viewType);
      const entityName = view.entity || inferFirstEntityName(spec) || '';
      const fieldLabels = fields.map((field) => field.label).join('、') || '表示項目なし';

      return {
        id,
        panelId: id,
        label,
        meta: `${viewTypeLabel(viewType)} · ${entityName ? toHumanLabel(entityName) : 'データ未指定'}`,
        icon: viewTypeIcon(viewType),
        kind: 'ui',
        viewType,
        entityName,
        fields,
        summary: [
          card('対象', label, `${viewTypeLabel(viewType)}として確認する画面です。`, true),
          card('扱うデータ', entityName ? toHumanLabel(entityName) : 'データ未指定', fieldLabels),
          card('操作', viewTypeActionTitle(viewType), viewTypeActionDescription(viewType))
        ]
      } satisfies UiViewProjection;
    });
}

function projectFields(spec: ReforgeSpec, view: ViewDef): ProjectedField[] {
  const entities = spec.entities ?? {};
  const entityName = view.entity && entities[view.entity] ? view.entity : inferFirstEntityName(spec);
  const entity = entityName ? entities[entityName] : undefined;
  const fields = entity?.fields ?? {};
  const fieldNames =
    Array.isArray(view.fields) && view.fields.length > 0
      ? view.fields.filter((fieldName) => typeof fieldName === 'string')
      : stableKeys(fields);

  return fieldNames.map((fieldName) => {
    const field = normalizeField(fields[fieldName]);
    return {
      name: fieldName,
      label: field.label || toHumanLabel(fieldName),
      type: field.type || 'string',
      required: field.required === true,
      options: Array.isArray(field.options) ? field.options.map(String) : undefined,
      sampleValue: sampleValueFor(field)
    };
  });
}

function normalizeField(field: FieldDef | undefined): FieldDef {
  if (!field || typeof field !== 'object') {
    return { type: 'string' };
  }
  return field;
}

function sampleValueFor(field: FieldDef): string | number | boolean {
  switch (field.type) {
    case 'number':
      return 1;
    case 'date':
      return '2026-05-04';
    case 'enum':
      return field.options?.[0] ?? '';
    case 'boolean':
      return false;
    case 'text':
      return '入力内容';
    default:
      return 'サンプル';
  }
}

function projectNonUiItems(spec: ReforgeSpec): NonUiProjection[] {
  const items: NonUiProjection[] = [];

  const backendSections = sectionsFromSources([
    ['DB', spec.database],
    ['バックエンド', spec.backend]
  ]);
  if (backendSections.length > 0) {
    items.push(nonUiItem('backend', 'DB・バックエンド', '保存 · 取得 · 成功時 · 失敗時', 'DB', backendSections));
  }

  const logicSections = sectionsFromSources([
    ['ロジック', spec.logic],
    ['フロー', spec.flows]
  ]);
  if (logicSections.length > 0) {
    items.push(nonUiItem('logic', 'ロジック', '検証 · 制約 · 状態遷移', 'LG', logicSections));
  }

  const unknownSections = stableKeys(spec)
    .filter((key) => !KNOWN_TOP_LEVEL.has(key))
    .map((key) => sectionFromValue(toHumanLabel(key), spec[key]));
  if (unknownSections.length > 0) {
    items.push(
      nonUiItem(
        'unclassified',
        '未分類仕様',
        '追加セクション',
        'UC',
        unknownSections
      )
    );
  }

  return items;
}

function sectionsFromSources(sources: Array<[string, unknown]>): NonUiSection[] {
  return sources
    .filter(([, value]) => isNonEmptyValue(value))
    .map(([title, value]) => sectionFromValue(title, value));
}

function sectionFromValue(title: string, value: unknown): NonUiSection {
  const bullets = valueToBullets(value);
  return {
    title,
    description: `${title}としてユーザーに見える結果を確認します。`,
    bullets: bullets.length > 0 ? bullets : ['確認可能な仕様項目があります。']
  };
}

function valueToBullets(value: unknown): string[] {
  if (!isNonEmptyValue(value)) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.map((item, index) => `${index + 1}. ${describeValue(item)}`);
  }
  if (value && typeof value === 'object') {
    return stableKeys(value as Record<string, unknown>).map((key) => {
      const nested = (value as Record<string, unknown>)[key];
      return `${toHumanLabel(key)}: ${describeValue(nested)}`;
    });
  }
  return [describeValue(value)];
}

function describeValue(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return stableStringify(value);
}

function isNonEmptyValue(value: unknown): boolean {
  if (value == null) {
    return false;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  if (typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>).length > 0;
  }
  return true;
}

function nonUiItem(
  idPart: string,
  label: string,
  meta: string,
  icon: string,
  sections: NonUiSection[]
): NonUiProjection {
  const id = `non-ui-${idPart}`;
  return {
    id,
    panelId: id,
    label,
    meta,
    icon,
    kind: 'non-ui',
    sections,
    summary: [
      card('対象', label, 'UI画面そのものではない仕様を確認します。', true),
      card('確認観点', meta.replace(/ · /g, ' / '), `${sections.length}件の観点があります。`)
    ]
  };
}

function createEmptyUiItem(spec: ReforgeSpec): UiViewProjection {
  return {
    id: 'view-empty',
    panelId: 'view-empty',
    label: 'UIビュー未定義',
    meta: 'UIプロトタイプ',
    icon: 'UI',
    kind: 'ui',
    viewType: 'empty',
    entityName: inferFirstEntityName(spec) || '',
    fields: [],
    summary: [
      card('対象', 'UIビュー未定義', '表示可能なUIビューがまだ仕様にありません。', true),
      card('次の確認', '非画面仕様', 'DB・バックエンド・ロジックなどは別項目として確認できます。')
    ]
  };
}

function card(kicker: string, title: string, description: string, current = false): SpecSummaryCard {
  return { kicker, title, description, current };
}

function inferFirstEntityName(spec: ReforgeSpec): string | undefined {
  return stableKeys(spec.entities).at(0);
}

function defaultViewLabel(viewType: UiViewType): string {
  switch (viewType) {
    case 'form':
      return '入力画面';
    case 'list':
      return '一覧画面';
    case 'detail':
      return '詳細画面';
    default:
      return 'UIビュー未定義';
  }
}

function viewTypeLabel(viewType: UiViewType): string {
  switch (viewType) {
    case 'form':
      return '入力画面';
    case 'list':
      return '一覧画面';
    case 'detail':
      return '詳細画面';
    default:
      return 'UI未定義';
  }
}

function viewTypeIcon(viewType: UiViewType): string {
  switch (viewType) {
    case 'form':
      return 'IN';
    case 'list':
      return 'LS';
    case 'detail':
      return 'DT';
    default:
      return 'UI';
  }
}

function viewTypeActionTitle(viewType: UiViewType): string {
  switch (viewType) {
    case 'form':
      return '入力と提出';
    case 'list':
      return '提出内容の反映';
    case 'detail':
      return '選択内容の確認';
    default:
      return '定義待ち';
  }
}

function viewTypeActionDescription(viewType: UiViewType): string {
  switch (viewType) {
    case 'form':
      return '値変更、提出、成功フィードバックを確認します。';
    case 'list':
      return '提出後の値が一覧に反映されることを確認します。';
    case 'detail':
      return '提出後の値が詳細に反映されることを確認します。';
    default:
      return 'UIビューが追加されるとプロトタイプが表示されます。';
  }
}
