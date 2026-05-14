import fs from 'node:fs/promises';
import path from 'node:path';

import type { SkillName, TargetEnvironment } from './types';
import { SKILL_COMMAND } from './types';

export const FORWARDER_TEMPLATE_FILE = {
  'claude-code': 'claude-code.md',
  codex: 'codex.md'
} as const satisfies Record<TargetEnvironment, string>;

export const FORWARDER_ARGUMENT_HINT: Partial<Record<SkillName, string>> = {
  'reforge-requirements': '\\"<idea>\\"',
  'reforge-impl': '[task-id]'
};

export interface RenderForwarderOptions {
  environment: TargetEnvironment;
  skillName: SkillName;
  template: string;
}

export async function loadForwarderTemplate(
  templatesDir: string,
  environment: TargetEnvironment
): Promise<string> {
  return fs.readFile(path.join(templatesDir, FORWARDER_TEMPLATE_FILE[environment]), 'utf8');
}

export function renderForwarder({
  environment,
  skillName,
  template
}: RenderForwarderOptions): string {
  const argumentHint =
    environment === 'claude-code' ? FORWARDER_ARGUMENT_HINT[skillName] : undefined;

  const rendered = template
    .replaceAll('{{SKILL_NAME}}', skillName)
    .replaceAll('{{SKILL_COMMAND}}', SKILL_COMMAND[skillName])
    .replaceAll('{{ARGUMENT_HINT}}', argumentHint ?? '');

  const withoutEmptyArgumentHint =
    argumentHint === undefined ? rendered.replace(/^argument-hint:\s*""\n/m, '') : rendered;

  if (/\{\{[A-Z_]+\}\}/.test(withoutEmptyArgumentHint)) {
    throw new Error(`Forwarder template for ${skillName} contains unresolved variables.`);
  }

  return withoutEmptyArgumentHint.endsWith('\n')
    ? withoutEmptyArgumentHint
    : `${withoutEmptyArgumentHint}\n`;
}
