export type FieldType = 'string' | 'number' | 'date' | 'enum' | 'text' | 'boolean' | string;

export interface FieldDef {
  type: FieldType;
  required?: boolean;
  options?: string[];
  label?: string;
}

export interface EntityDef {
  fields: Record<string, FieldDef>;
}

export type ViewType = 'form' | 'list' | 'detail' | string;

export interface ViewDef {
  type: ViewType;
  entity?: string;
  title?: string;
  fields?: string[];
  [key: string]: unknown;
}

export interface ReforgeSpec {
  meta: {
    name: string;
    version?: string;
    lang?: 'en' | 'ja' | string;
  };
  entities?: Record<string, EntityDef>;
  views?: Record<string, ViewDef>;
  flows?: Record<string, unknown>;
  backend?: Record<string, unknown>;
  database?: Record<string, unknown>;
  logic?: Record<string, unknown>;
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
  fields: ProjectedField[];
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
