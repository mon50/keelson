export const TARGET_ENVIRONMENTS = ['claude-code', 'codex'] as const;

export type TargetEnvironment = (typeof TARGET_ENVIRONMENTS)[number];

export const ALL_SKILLS = [
  'keel-requirements',
  'keel-us',
  'keel-design',
  'keel-proto',
  'keel-plan',
  'keel-impl',
  'keel-status'
] as const;

export type SkillName = (typeof ALL_SKILLS)[number];

export const SKILL_COMMAND = {
  'keel-requirements': 'requirements "<idea>"',
  'keel-us': 'us',
  'keel-design': 'design',
  'keel-proto': 'proto',
  'keel-plan': 'plan',
  'keel-impl': 'impl [task-id]',
  'keel-status': 'status'
} as const satisfies Record<SkillName, string>;

export type SkillCommand = (typeof SKILL_COMMAND)[SkillName];

export type KeelsonPhase =
  | 'requirements'
  | 'user-stories'
  | 'design'
  | 'prototype'
  | 'plan'
  | 'implementation';

export type ArtifactStatus = 'draft' | 'needs_revision' | 'approved';

export interface ArtifactRecord {
  path: string;
  phase: KeelsonPhase;
  status: ArtifactStatus;
  digest?: string;
  approvedAt?: string;
  notes?: string;
}

export interface KeelsonManifest {
  version: 1;
  feature: string;
  lang?: string;
  currentPhase: KeelsonPhase;
  artifacts: {
    requirements: ArtifactRecord;
    userStories: ArtifactRecord;
    usMock: ArtifactRecord;
    design: ArtifactRecord;
    prototype: ArtifactRecord;
    plan: ArtifactRecord;
  };
}

export type TaskStatus = 'pending' | 'in_progress' | 'done';

export interface TaskEntry {
  id: string;
  title: string;
  status: TaskStatus;
  source: 'requirements' | 'user-story' | 'design' | 'prototype';
  dependsOn?: string[];
  acceptance?: string[];
  files?: string[];
}

export interface TasksJson {
  tasks: TaskEntry[];
}

export const ENV_SKILL_DIR = {
  'claude-code': '.claude/skills',
  codex: '.agents/skills'
} as const satisfies Record<TargetEnvironment, string>;

export const KEELSON_DIR = '.keelson' as const;

export interface SelectorOptions {
  input?: NodeJS.ReadableStream;
  output?: NodeJS.WritableStream;
}

export interface PackageAssets {
  packageRoot: string;
  coreSkillsDir: string;
  templatesDir: string;
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
