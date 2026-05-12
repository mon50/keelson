export const TARGET_ENVIRONMENTS = ['claude-code', 'codex'] as const;

export type TargetEnvironment = (typeof TARGET_ENVIRONMENTS)[number];

export const ALL_SKILLS = [
  'reforge-init',
  'reforge-resume',
  'reforge-answer',
  'reforge-update',
  'reforge-diff',
  'reforge-plan',
  'reforge-validate',
  'reforge-render',
  'reforge-impl',
  'reforge-verify'
] as const;

export type SkillName = (typeof ALL_SKILLS)[number];

export const SKILL_COMMAND = {
  'reforge-init': 'init',
  'reforge-resume': 'resume',
  'reforge-answer': 'answer',
  'reforge-update': 'update',
  'reforge-diff': 'diff',
  'reforge-plan': 'plan',
  'reforge-validate': 'validate',
  'reforge-render': 'render',
  'reforge-impl': 'impl [entity]',
  'reforge-verify': 'verify'
} as const satisfies Record<SkillName, string>;

export type SkillCommand = (typeof SKILL_COMMAND)[SkillName];

export type FieldType = 'string' | 'number' | 'date' | 'enum' | 'text' | 'boolean';

export interface FieldDefinition {
  type: FieldType;
  required?: boolean;
  /** Required when type is "enum". */
  options?: string[];
}

export interface EntityDefinition {
  fields: Record<string, FieldDefinition>;
}

export interface ViewDefinition {
  type: string;
  entity: string;
  fields?: string[];
}

export interface FlowDefinition {
  steps: string[];
}

export interface SpecMeta {
  name: string;
  version: string;
  lang: string;
  /** Defaults to false until the UI prototype is approved. */
  approved: boolean;
  /** Target audience tags (non-engineer friendly). Filled in Inception phase. */
  audience?: string[];
  /** One-line product intent: the problem being solved. Filled in Inception phase. */
  intent?: string;
  /** ISO timestamp recorded when meta.approved is set to true. */
  approvedAt?: string;
  /** Hash or marker captured at approval time. */
  approvedDigest?: string;
}

export interface SpecTech {
  frontend: string;
  backend: string;
  database: string;
  orm: string;
  styling: string;
  testing: string;
}

/**
 * User-story style requirement entry. AI-DLC Inception artifact that sits between
 * intent and Construction-phase artifacts (entities/views/flows/tech).
 */
export interface RequirementEntry {
  id: string;
  /** "As a <role>" */
  as: string;
  /** "I want <feature>" */
  want: string;
  /** "so that <benefit>" */
  so_that: string;
}

export type SpecMode = 'greenfield' | 'brownfield' | 'unknown';

export interface SpecContext {
  /** Greenfield MVP, brownfield feature work, or unknown when the intent is not explicit. */
  mode?: SpecMode;
  repository?: {
    existing?: boolean;
    summary?: string;
    detectedStack?: string[];
    conventions?: string[];
  };
  changeScope?: {
    feature?: string;
    affectedAreas?: string[];
    allowedWriteAreas?: string[];
    protectedAreas?: string[];
  };
  acceptanceCriteria?: string[];
  risks?: string[];
}

export interface SpecJson {
  meta: SpecMeta;
  /** AI-DLC Inception artifact. Optional for backward compatibility. */
  requirements?: RequirementEntry[];
  /** Optional context for new MVPs and existing-repository feature work. */
  context?: SpecContext;
  tech: SpecTech;
  entities: Record<string, EntityDefinition>;
  views: Record<string, ViewDefinition>;
  flows: Record<string, FlowDefinition>;
}

export type QuestionPhase =
  | 'meta'
  | 'audience'
  | 'intent'
  | 'requirements'
  | 'tech'
  | 'data'
  | 'views'
  | 'flows'
  | 'update';

export interface PendingQuestion {
  id: string;
  phase: QuestionPhase;
  question: string;
  type: string;
  /** JSON paths resolved by the answer. */
  resolves: string[];
  /** Optional selection options for single_choice / multi_choice / confirm questions. */
  options?: string[];
}

export interface AnsweredQuestion extends PendingQuestion {
  answer: string;
}

export interface QuestionsJson {
  pending: PendingQuestion[];
  answered: AnsweredQuestion[];
}

export type TaskStatus = 'pending' | 'in_progress' | 'done';

export type Subtask = 'db' | 'api' | 'ui' | 'test';

export interface TaskEntry {
  id: string;
  entity: string;
  status: TaskStatus;
  subtasks: Subtask[];
}

export interface TasksJson {
  tasks: TaskEntry[];
}

export const ENV_SKILL_DIR = {
  'claude-code': '.claude/skills',
  codex: '.agents/skills'
} as const satisfies Record<TargetEnvironment, string>;

export const SPECS_DIR = '.reforge/specs' as const;

export interface SelectorOptions {
  input?: NodeJS.ReadableStream;
  output?: NodeJS.WritableStream;
}

export interface PackageAssets {
  packageRoot: string;
  coreSkillsDir: string;
  templatesDir: string;
  rendererServerDir: string;
}

export interface InstallConfig {
  cwd: string;
  environments: readonly TargetEnvironment[];
  skills: readonly SkillName[];
  assets?: PackageAssets;
}

export interface InstallError {
  path: string;
  reason: string;
}

export interface InstallResult {
  success: boolean;
  skillsInstalled: SkillName[];
  rendererServerInstalled?: string;
  forwardingInstalled: Partial<Record<TargetEnvironment, SkillName[]>>;
  overwritten: string[];
  error?: InstallError;
}

export type InstallEvent =
  | { type: 'overwrite'; path: string }
  | { type: 'error'; path: string; reason: string };

export interface ReporterOptions {
  stdout?: NodeJS.WritableStream;
  stderr?: NodeJS.WritableStream;
}
