import { describe, it, expect, beforeEach } from 'vitest';
import { Writable } from 'node:stream';
import { report } from '../src/reporter';
import { ALL_SKILLS } from '../src/types';
import type { InstallResult } from '../src/types';

function makeStream(): { stream: Writable; get: () => string } {
  let buf = '';
  const stream = new Writable({
    write(chunk, _enc, cb) {
      buf += chunk.toString();
      cb();
    }
  });
  return { stream, get: () => buf };
}

function makeSuccessResult(overrides?: Partial<InstallResult>): InstallResult {
  return {
    success: true,
    skillsInstalled: [...ALL_SKILLS],
    forwardingInstalled: {
      'claude-code': [...ALL_SKILLS]
    },
    overwritten: [],
    ...overrides
  };
}

describe('report()', () => {
  let stdout: Writable;
  let getOutput: () => string;

  beforeEach(() => {
    const s = makeStream();
    stdout = s.stream;
    getOutput = s.get;
  });

  it('success=true のとき全10コマンドが stdout に含まれる', () => {
    report(makeSuccessResult(), { stdout });

    const out = getOutput();
    expect(out).toContain('/reforge-validate');
    expect(out).toContain('/reforge-init');
    expect(out).toContain('/reforge-resume');
    expect(out).toContain('/reforge-answer');
    expect(out).toContain('/reforge-update');
    expect(out).toContain('/reforge-diff');
    expect(out).toContain('/reforge-plan');
    expect(out).toContain('/reforge-render');
    expect(out).toContain('/reforge-impl');
    expect(out).toContain('/reforge-verify');
    expect(out).not.toContain('/reforge:');
  });

  it('インストール済み環境 (claude-code) とスキル数 (10) が表示される', () => {
    report(makeSuccessResult(), { stdout });

    const out = getOutput();
    expect(out).toContain('claude-code');
    expect(out).toContain('10');
  });

  it('overwritten が空の場合、上書きリストが表示されない', () => {
    report(makeSuccessResult({ overwritten: [] }), { stdout });

    const out = getOutput();
    // 上書きセクションのヘッダが含まれないことを確認
    expect(out).not.toContain('Overwritten');
    expect(out).not.toContain('上書き');
  });

  it('overwritten に値がある場合、上書きファイルが表示される', () => {
    report(
      makeSuccessResult({ overwritten: ['.claude/skills/reforge-init/SKILL.md'] }),
      { stdout }
    );

    const out = getOutput();
    expect(out).toContain('.claude/skills/reforge-init/SKILL.md');
  });

  it('次のステップとして /reforge-init の案内が含まれる', () => {
    report(makeSuccessResult(), { stdout });

    const out = getOutput();
    expect(out).toContain('/reforge-init');
  });

  it('success=false の場合、エラーが stderr に出力される', () => {
    const errStream = makeStream();
    const result: InstallResult = {
      success: false,
      skillsInstalled: [],
      forwardingInstalled: {},
      overwritten: [],
      error: { path: '.claude/skills', reason: 'Permission denied' }
    };

    report(result, { stdout, stderr: errStream.stream });

    const errOut = errStream.get();
    expect(errOut).toContain('Permission denied');
    // stdout には何も出力されないか、エラーは stderr のみ
    const stdOut = getOutput();
    expect(stdOut).toBe('');
  });
});
