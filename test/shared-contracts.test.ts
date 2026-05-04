import { describe, expect, it } from 'vitest';

import {
  ALL_SKILLS,
  ENV_SKILL_DIR,
  SKILL_COMMAND,
  TARGET_ENVIRONMENTS
} from '../src/types';

describe('installer shared contracts', () => {
  it('defines all supported target environments and their skill directories', () => {
    expect(TARGET_ENVIRONMENTS).toEqual(['claude-code', 'codex']);
    expect(ENV_SKILL_DIR).toEqual({
      'claude-code': '.claude/skills',
      codex: '.agents/skills'
    });
    expect(Object.keys(ENV_SKILL_DIR).sort()).toEqual([...TARGET_ENVIRONMENTS].sort());
  });

  it('defines the complete installable skill list including renderer', () => {
    expect(ALL_SKILLS).toEqual([
      'reforge-init',
      'reforge-resume',
      'reforge-update',
      'reforge-diff',
      'reforge-validate',
      'reforge-render'
    ]);
  });

  it('maps every installable skill to the command used in forwarder templates', () => {
    expect(SKILL_COMMAND).toEqual({
      'reforge-init': 'init',
      'reforge-resume': 'resume',
      'reforge-update': 'update',
      'reforge-diff': 'diff',
      'reforge-validate': 'validate',
      'reforge-render': 'render'
    });
    expect(Object.keys(SKILL_COMMAND).sort()).toEqual([...ALL_SKILLS].sort());
  });
});
