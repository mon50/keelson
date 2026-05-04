export const TARGET_ENVIRONMENTS = ['claude-code', 'codex'] as const;

export type TargetEnvironment = (typeof TARGET_ENVIRONMENTS)[number];

export const ALL_SKILLS = [
  'reforge-init',
  'reforge-resume',
  'reforge-update',
  'reforge-diff',
  'reforge-validate',
  'reforge-render'
] as const;

export type SkillName = (typeof ALL_SKILLS)[number];

export const SKILL_COMMAND = {
  'reforge-init': 'init',
  'reforge-resume': 'resume',
  'reforge-update': 'update',
  'reforge-diff': 'diff',
  'reforge-validate': 'validate',
  'reforge-render': 'render'
} as const satisfies Record<SkillName, string>;

export type SkillCommand = (typeof SKILL_COMMAND)[SkillName];

export const ENV_SKILL_DIR = {
  'claude-code': '.claude/skills',
  codex: '.agents/skills'
} as const satisfies Record<TargetEnvironment, string>;

export interface SelectorOptions {
  input?: NodeJS.ReadableStream;
  output?: NodeJS.WritableStream;
}

export interface PackageAssets {
  packageRoot: string;
  coreSkillsDir: string;
  templatesDir: string;
  rendererServerEntry: string;
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
