import type {
  FieldDef,
  NonUiProjection,
  NonUiSection,
  ProjectedField,
  ReforgeSpec,
  SpecProjection,
  SpecSummaryCard,
  UiBlueprintDef,
  UiBlueprintLayout,
  UiBlueprintTokens,
  UiViewBlueprint,
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
  'flows',
  'requirements',
  'context',
  'tech',
  'uiBlueprint',
  'uiArtifacts'
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
      const entityLabel = entityName ? toHumanLabel(entityName) : 'データ未指定';
      const fieldLabels = fields.map((field) => field.label).join('、') || '表示項目なし';
      const blueprint = resolveViewBlueprint(spec.uiBlueprint, viewName, view, viewType);
      const description =
        view.description ||
        blueprint.view.description ||
        defaultViewDescription(viewType, label, entityLabel, blueprint.designIntent);
      const requirements = collectRequirementsForView(spec, viewName, view);

      return {
        id,
        panelId: id,
        label,
        meta: `${viewTypeLabel(viewType)} · ${entityLabel}`,
        icon: viewTypeIcon(viewType),
        kind: 'ui',
        viewType,
        entityName,
        description,
        template: blueprint.view.template || inferTemplate(viewName, view, viewType, blueprint),
        density: blueprint.view.density || blueprint.density,
        designIntent: blueprint.designIntent,
        visualReferences: blueprint.visualReferences,
        layout: blueprint.layout,
        components: mergeStrings(blueprint.components, blueprint.view.components),
        states: mergeStrings(blueprint.states, blueprint.view.states),
        tokens: blueprint.tokens,
        sampleDataPolicy: blueprint.sampleDataPolicy,
        fields,
        requirements,
        sampleRows: sampleRowsFor(fields),
        primaryActionLabel: primaryActionLabel(view, viewType, blueprint.view),
        secondaryActionLabel: secondaryActionLabel(view, viewType, blueprint.view),
        summary: [
          card('対象', label, description, true),
          card('扱うデータ', entityLabel, fieldLabels),
          card(
            'UI方針',
            blueprintLabel(blueprint),
            blueprint.visualReferences.length > 0
              ? `${blueprint.visualReferences.join('、')} を参照した ${blueprint.density} 密度の画面です。`
              : 'uiBlueprint を追加すると、視覚方針とテンプレートを固定できます。'
          ),
          card(
            '要件',
            requirements.length > 0 ? `${requirements.length}件を表示` : '未定義',
            requirements[0] || 'requirements を追加すると、画面ごとに満たすべきUSを確認できます。'
          ),
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
      sampleValue: field.sampleValue ?? sampleValueFor(field, fieldName, 0)
    };
  });
}

function normalizeField(field: FieldDef | undefined): FieldDef {
  if (!field || typeof field !== 'object') {
    return { type: 'string' };
  }
  return field;
}

function sampleRowsFor(fields: ProjectedField[]): Array<Record<string, string | number | boolean>> {
  return [0, 1, 2].map((index) =>
    Object.fromEntries(
      fields.map((field) => [field.name, sampleValueFor(projectedFieldToFieldDef(field), field.name, index)])
    )
  );
}

function projectedFieldToFieldDef(field: ProjectedField): FieldDef {
  return {
    type: field.type,
    required: field.required,
    options: field.options,
    label: field.label,
    sampleValue: field.sampleValue
  };
}

function sampleValueFor(field: FieldDef, fieldName = '', index = 0): string | number | boolean {
  if (field.sampleValue != null && index === 0) {
    return field.sampleValue;
  }

  const key = `${fieldName} ${field.label ?? ''}`.toLowerCase();
  switch (field.type) {
    case 'number':
      if (/hour|time|duration|時間/.test(key)) {
        return [6, 4.5, 8][index] ?? 6;
      }
      if (/amount|price|cost|total|金額|価格/.test(key)) {
        return [12800, 8400, 19600][index] ?? 12800;
      }
      if (/rating|rate|評価|レート/.test(key)) {
        return [4.5, 4.2, 4.8][index] ?? 4.5;
      }
      return [12, 8, 21][index] ?? 12;
    case 'date':
      return ['2026-05-04', '2026-05-05', '2026-05-06'][index] ?? '2026-05-04';
    case 'enum':
      return field.options?.[index % Math.max(field.options.length, 1)] ?? '';
    case 'boolean':
      return [false, true, true][index] ?? false;
    case 'text':
      return textSampleFor(key, index);
    default:
      return stringSampleFor(key, index);
  }
}

function stringSampleFor(key: string, index: number): string {
  if (/product|item|商品|製品/.test(key)) {
    return ['ワイヤレスイヤホン Pro', '軽量バックパック', 'スマートLEDライト'][index] ?? 'ワイヤレスイヤホン Pro';
  }
  if (/brand|maker|ブランド|メーカー/.test(key)) {
    return ['Northstar', 'Kite Lab', 'Hikari Works'][index] ?? 'Northstar';
  }
  if (/category|カテゴリ/.test(key)) {
    return ['家電', 'バッグ', 'ホーム'][index] ?? '家電';
  }
  if (/delivery|shipping|配送|納期/.test(key)) {
    return ['明日お届け', '通常配送無料', '本日中に発送'][index] ?? '明日お届け';
  }
  if (/title|件名|タイトル|name|名前/.test(key)) {
    return ['週次レビューの準備', '顧客ヒアリング整理', 'リリース前チェック'][index] ?? '週次レビューの準備';
  }
  if (/owner|assignee|担当|user|ユーザー/.test(key)) {
    return ['佐藤', '高橋', '田中'][index] ?? '佐藤';
  }
  if (/email|mail/.test(key)) {
    return ['sato@example.com', 'takahashi@example.com', 'tanaka@example.com'][index] ?? 'sato@example.com';
  }
  if (/status|状態|ステータス/.test(key)) {
    return ['draft', 'submitted', 'review'][index] ?? 'draft';
  }
  return ['サンプル A', 'サンプル B', 'サンプル C'][index] ?? 'サンプル A';
}

function textSampleFor(key: string, index: number): string {
  if (/content|body|description|memo|note|内容|説明|メモ/.test(key)) {
    return [
      '主要な進捗、課題、次の一手を短く共有します。',
      '判断に必要な背景と補足情報をまとめます。',
      '確認者が次に取る行動を明確にします。'
    ][index] ?? '主要な進捗、課題、次の一手を短く共有します。';
  }
  return ['入力内容 A', '入力内容 B', '入力内容 C'][index] ?? '入力内容 A';
}

function collectRequirementsForView(spec: ReforgeSpec, viewName: string, view: ViewDef): string[] {
  const local = flattenRequirementSource(view.requirements ?? view.userStories ?? view.acceptanceCriteria);
  const global = Array.isArray(spec.requirements)
    ? spec.requirements
        .filter((item) => requirementMatchesView(item, viewName))
        .map(requirementToText)
        .filter(Boolean)
    : [];
  const merged = [...local, ...global];
  return Array.from(new Set(merged)).slice(0, 5);
}

function flattenRequirementSource(source: unknown): string[] {
  if (!source) {
    return [];
  }
  if (Array.isArray(source)) {
    return source.map(requirementToText).filter(Boolean);
  }
  return [requirementToText(source)].filter(Boolean);
}

function requirementMatchesView(requirement: unknown, viewName: string): boolean {
  if (!requirement || typeof requirement !== 'object') {
    return true;
  }
  const record = requirement as Record<string, unknown>;
  const refs = [record.view, record.viewId, record.viewName, record.screen, record.screenId, record.views]
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter((value): value is string => typeof value === 'string');
  if (refs.length === 0) {
    return true;
  }
  return refs.includes(viewName);
}

function requirementToText(requirement: unknown): string {
  if (typeof requirement === 'string') {
    return requirement;
  }
  if (!requirement || typeof requirement !== 'object') {
    return '';
  }
  const record = requirement as Record<string, unknown>;
  const story = [record.as, record.want, record.so_that]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join(' / ');
  const title = firstString(
    record.title,
    record.name,
    record.userStory,
    record.story,
    record.requirement,
    record.description,
    story
  );
  const criteria = flattenRequirementSource(record.acceptanceCriteria ?? record.acceptance ?? record.criteria);
  if (title && criteria.length > 0) {
    return `${title} / ${criteria[0]}`;
  }
  if (title) {
    return title;
  }
  return stableStringify(requirement);
}

function firstString(...values: unknown[]): string {
  const value = values.find((item) => typeof item === 'string' && item.trim().length > 0);
  return typeof value === 'string' ? value : '';
}

interface ResolvedBlueprint {
  designIntent: string;
  visualReferences: string[];
  density: string;
  layout: UiBlueprintLayout;
  components: string[];
  states: string[];
  sampleDataPolicy: string;
  tokens: UiBlueprintTokens;
  view: UiViewBlueprint;
}

function resolveViewBlueprint(
  blueprint: UiBlueprintDef | undefined,
  viewName: string,
  view: ViewDef,
  viewType: UiViewType
): ResolvedBlueprint {
  const viewBlueprint = blueprint?.views?.[viewName] ?? {};
  const components = stringsFrom(blueprint?.components);
  const visualReferences = stringsFrom(blueprint?.visualReferences);
  const layout = blueprint?.layout ?? {};
  const shell = lower(`${layout.shell ?? ''} ${layout.main ?? ''} ${components.join(' ')} ${visualReferences.join(' ')}`);
  const commerceLike =
    /commerce|marketplace|product|商品|ec|ecommerce|amazon|楽天|shop/.test(shell) ||
    stringsFrom(viewBlueprint.components).some((component) => /product|cart|price|rating|search/i.test(component));

  return {
    designIntent: stringOrDefault(blueprint?.designIntent, commerceLike ? 'marketplace product discovery' : ''),
    visualReferences,
    density: stringOrDefault(blueprint?.density, commerceLike ? 'high' : 'comfortable'),
    layout,
    components,
    states: stringsFrom(blueprint?.states),
    sampleDataPolicy: stringOrDefault(blueprint?.sampleDataPolicy, 'realistic'),
    tokens: blueprint?.tokens ?? {},
    view: {
      ...viewBlueprint,
      template: viewBlueprint.template || (commerceLike && viewType === 'list' ? 'commerce-product-grid' : undefined)
    }
  };
}

function inferTemplate(
  viewName: string,
  view: ViewDef,
  viewType: UiViewType,
  blueprint: ResolvedBlueprint
): string {
  if (typeof view.template === 'string' && view.template.trim()) {
    return view.template;
  }
  const key = lower(
    `${viewName} ${view.title ?? ''} ${blueprint.layout.shell ?? ''} ${blueprint.layout.main ?? ''} ${blueprint.components.join(
      ' '
    )} ${blueprint.visualReferences.join(' ')}`
  );
  if (/commerce|marketplace|product|商品|ec|ecommerce|amazon|楽天|shop|cart|price|rating/.test(key)) {
    return viewType === 'list' ? 'commerce-product-grid' : 'commerce';
  }
  if (/dashboard|home|overview|summary|ホーム|ダッシュボード|サマリー/.test(key)) {
    return 'dashboard';
  }
  if (/calendar|schedule|予定|日程/.test(key)) {
    return 'calendar';
  }
  if (/feed|timeline|activity|タイムライン|フィード/.test(key)) {
    return 'timeline';
  }
  switch (viewType) {
    case 'form':
      return 'editor';
    case 'detail':
      return 'detail';
    case 'list':
      return 'workspace';
    default:
      return 'workspace';
  }
}

function primaryActionLabel(view: ViewDef, viewType: UiViewType, blueprint: UiViewBlueprint): string {
  if (typeof view.primaryAction === 'string' && view.primaryAction.trim()) {
    return view.primaryAction;
  }
  if (typeof blueprint.primaryAction === 'string' && blueprint.primaryAction.trim()) {
    return blueprint.primaryAction;
  }
  if (viewType === 'list' && blueprint.template === 'commerce-product-grid') {
    return 'カートに入れる';
  }
  switch (viewType) {
    case 'form':
      return '保存する';
    case 'list':
      return '新規作成';
    case 'detail':
      return '編集する';
    default:
      return '確認する';
  }
}

function secondaryActionLabel(view: ViewDef, viewType: UiViewType, blueprint: UiViewBlueprint): string {
  if (typeof view.secondaryAction === 'string' && view.secondaryAction.trim()) {
    return view.secondaryAction;
  }
  if (typeof blueprint.secondaryAction === 'string' && blueprint.secondaryAction.trim()) {
    return blueprint.secondaryAction;
  }
  if (viewType === 'list' && blueprint.template === 'commerce-product-grid') {
    return '比較する';
  }
  switch (viewType) {
    case 'form':
      return '下書き';
    case 'list':
      return '絞り込み';
    case 'detail':
      return '共有';
    default:
      return '戻る';
  }
}

function projectNonUiItems(spec: ReforgeSpec): NonUiProjection[] {
  const items: NonUiProjection[] = [];

  const coreSections = coreSpecSections(spec);
  if (coreSections.length > 0) {
    items.push(
      nonUiItem('core', '要件・文脈・技術', '要求 · 変更範囲 · 技術選定', 'SP', coreSections)
    );
  }

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

function coreSpecSections(spec: ReforgeSpec): NonUiSection[] {
  return [
    requirementsSection(spec.requirements),
    isNonEmptyValue(spec.context) ? sectionFromValue('文脈', spec.context) : undefined,
    isNonEmptyValue(spec.tech) ? sectionFromValue('技術スタック', spec.tech) : undefined
  ].filter((section): section is NonUiSection => Boolean(section));
}

function requirementsSection(requirements: ReforgeSpec['requirements']): NonUiSection | undefined {
  if (!isNonEmptyValue(requirements)) {
    return undefined;
  }
  const bullets = Array.isArray(requirements)
    ? requirements.map((requirement, index) => `${index + 1}. ${requirementToText(requirement)}`)
    : valueToBullets(requirements);
  return {
    title: '要件',
    description: '承認対象のユーザーストーリーと受け入れ条件を確認します。',
    bullets: bullets.length > 0 ? bullets : ['確認可能な要件があります。']
  };
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
    meta: 'Spec Preview',
    icon: 'UI',
    kind: 'ui',
    viewType: 'empty',
    entityName: inferFirstEntityName(spec) || '',
    description: 'UIビューが仕様化される前の確認状態です。',
    template: 'workspace',
    density: spec.uiBlueprint?.density || 'comfortable',
    designIntent: spec.uiBlueprint?.designIntent || '',
    visualReferences: stringsFrom(spec.uiBlueprint?.visualReferences),
    layout: spec.uiBlueprint?.layout ?? {},
    components: stringsFrom(spec.uiBlueprint?.components),
    states: stringsFrom(spec.uiBlueprint?.states),
    tokens: spec.uiBlueprint?.tokens ?? {},
    sampleDataPolicy: spec.uiBlueprint?.sampleDataPolicy || 'realistic',
    fields: [],
    requirements: Array.isArray(spec.requirements)
      ? spec.requirements.map(requirementToText).filter(Boolean).slice(0, 5)
      : [],
    sampleRows: [],
    primaryActionLabel: '確認する',
    secondaryActionLabel: '戻る',
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

function defaultViewDescription(
  viewType: UiViewType,
  label: string,
  entityLabel: string,
  designIntent = ''
): string {
  const intent = designIntent ? ` ${designIntent} の方針で表現します。` : '';
  switch (viewType) {
    case 'form':
      return `${label}で${entityLabel}を作成・更新し、入力後の状態まで確認します。${intent}`;
    case 'list':
      return `${entityLabel}を検索、比較し、次の操作へ進むための一覧画面です。${intent}`;
    case 'detail':
      return `${entityLabel}の内容、状態、関連アクションを1画面で確認します。${intent}`;
    default:
      return 'UIビューが追加されると、ここに画面の意図と操作が表示されます。';
  }
}

function blueprintLabel(blueprint: ResolvedBlueprint): string {
  const shell = blueprint.layout.shell || blueprint.layout.main || blueprint.view.template;
  return shell ? toHumanLabel(shell) : blueprint.density;
}

function stringsFrom(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function mergeStrings(...groups: Array<string[] | undefined>): string[] {
  return Array.from(new Set(groups.flatMap((group) => group ?? [])));
}

function stringOrDefault(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function lower(value: string): string {
  return value.toLowerCase();
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
      return 'UIビューが追加されると Spec Preview が表示されます。';
  }
}
