export type FieldType = 'string' | 'number' | 'date' | 'enum' | 'text' | 'boolean' | string;

export interface FieldDef {
  type: FieldType;
  required?: boolean;
  options?: string[];
  label?: string;
  sampleValue?: string | number | boolean;
}

export interface EntityDef {
  fields: Record<string, FieldDef>;
}

export type ViewType = 'form' | 'list' | 'detail' | string;

export interface ViewDef {
  type: ViewType;
  entity?: string;
  title?: string;
  description?: string;
  fields?: string[];
  primaryAction?: string;
  secondaryAction?: string;
  template?: string;
  [key: string]: unknown;
}

export interface UiBlueprintTokens {
  accentColor?: string;
  surfaceColor?: string;
  textColor?: string;
  borderRadius?: string;
}

export interface UiBlueprintLayout {
  shell?: string;
  header?: string[];
  navigation?: string[];
  main?: string;
}

export interface UiSourceDef {
  type: string;
  path?: string;
  url?: string;
  description?: string;
  scope?: string;
}

export interface UiViewBlueprint {
  template?: string;
  description?: string;
  density?: string;
  components?: string[];
  states?: string[];
  primaryAction?: string;
  secondaryAction?: string;
}

export interface UiBlueprintDef {
  mode?: string;
  designIntent?: string;
  visualReferences?: string[];
  sources?: UiSourceDef[];
  componentMap?: Record<string, string>;
  doNotCopyBrand?: boolean;
  fidelity?: string;
  renderStrategy?: string;
  density?: string;
  layout?: UiBlueprintLayout;
  components?: string[];
  states?: string[];
  sampleDataPolicy?: string;
  tokens?: UiBlueprintTokens;
  views?: Record<string, UiViewBlueprint>;
}

export interface UiArtifactsDef {
  prototype?: string;
  mode?: string;
  sourceDigest?: string;
  approvedDigest?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReforgeSpec {
  meta: {
    name: string;
    version?: string;
    lang?: 'en' | 'ja' | string;
    approved?: boolean;
    approvedAt?: string;
    approvedDigest?: string;
  };
  entities?: Record<string, EntityDef>;
  views?: Record<string, ViewDef>;
  flows?: Record<string, unknown>;
  backend?: Record<string, unknown>;
  database?: Record<string, unknown>;
  logic?: Record<string, unknown>;
  requirements?: unknown[];
  context?: Record<string, unknown>;
  tech?: Record<string, unknown>;
  uiBlueprint?: UiBlueprintDef;
  uiArtifacts?: UiArtifactsDef;
  [key: string]: unknown;
}

export type LoadErrorCode = 'NOT_FOUND' | 'AMBIGUOUS_SPEC' | 'PARSE_ERROR' | 'READ_ERROR';

export interface LoadError {
  code: LoadErrorCode;
  message: string;
}

export type LoadResult =
  | { ok: true; spec: ReforgeSpec; specPath: string }
  | { ok: false; error: LoadError };

export type ConfirmationKind = 'ui' | 'non-ui';
export type LayoutKind = 'pc' | 'smp';
export type UiViewType = 'form' | 'list' | 'detail' | 'empty';

export interface SpecSummaryCard {
  kicker: string;
  title: string;
  description: string;
  current?: boolean;
}

export interface ConfirmationItem {
  id: string;
  panelId: string;
  label: string;
  meta: string;
  icon: string;
  kind: ConfirmationKind;
  summary: SpecSummaryCard[];
}

export interface ProjectedField {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
  sampleValue?: string | number | boolean;
}

export interface UiViewProjection extends ConfirmationItem {
  kind: 'ui';
  viewType: UiViewType;
  entityName: string;
  description: string;
  template: string;
  density: string;
  designIntent: string;
  visualReferences: string[];
  layout: UiBlueprintLayout;
  components: string[];
  states: string[];
  tokens: UiBlueprintTokens;
  sampleDataPolicy: string;
  fields: ProjectedField[];
  requirements: string[];
  sampleRows: Array<Record<string, string | number | boolean>>;
  primaryActionLabel: string;
  secondaryActionLabel: string;
}

export interface NonUiSection {
  title: string;
  description: string;
  bullets: string[];
}

export interface NonUiProjection extends ConfirmationItem {
  kind: 'non-ui';
  sections: NonUiSection[];
}

export interface SpecProjection {
  appName: string;
  version?: string;
  lang?: string;
  items: Array<UiViewProjection | NonUiProjection>;
  layouts: LayoutKind[];
}

export interface ShellSlots {
  appName: string;
  appMeta: string;
  sidebarHtml: string;
  initialSummaryHtml: string;
  prototypeHtml: string;
  nonUiSpecHtml: string;
  interactionScript: string;
}
