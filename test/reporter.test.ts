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

  it('success=true のとき新しい全コマンドが stdout に含まれる', () => {
    report(makeSuccessResult(), { stdout });

    const out = getOutput();
    expect(out).toContain('/keel-requirements');
    expect(out).toContain('/keel-us');
    expect(out).toContain('/keel-design');
    expect(out).toContain('/keel-proto');
    expect(out).toContain('/keel-plan');
    expect(out).toContain('/keel-impl');
    expect(out).toContain('/keel-status');
    expect(out).toContain('/keel-steering');
    expect(out).not.toContain('/keelson-init');
    expect(out).not.toContain('/keelson-render');
    expect(out).not.toContain('/keelson-verify');
    expect(out).not.toContain('/keelson:');
    expect(out).not.toContain('/keelson-');
  });

  it('インストール済み環境 (claude-code) とスキル数が表示される', () => {
    report(makeSuccessResult(), { stdout });

    const out = getOutput();
    expect(out).toContain('claude-code');
    expect(out).toContain(String(ALL_SKILLS.length));
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
      makeSuccessResult({ overwritten: ['.claude/skills/keel-requirements/SKILL.md'] }),
      { stdout }
    );

    const out = getOutput();
    expect(out).toContain('.claude/skills/keel-requirements/SKILL.md');
  });

  it('次のステップとして /keel-requirements の案内が含まれる', () => {
    report(makeSuccessResult(), { stdout });

    const out = getOutput();
    expect(out).toContain('/keel-requirements "<作りたい体験や機能>"');
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
