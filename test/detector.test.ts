import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { detect } from '../src/detector';

describe('EnvironmentDetector.detect()', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reforge-detector-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('.claude/ のみ存在する場合は ["claude-code"] を返す', async () => {
    fs.mkdirSync(path.join(tmpDir, '.claude'));
    const result = await detect(tmpDir);
    expect(result).toEqual(['claude-code']);
  });

  it('.agents/ のみ存在する場合は ["codex"] を返す', async () => {
    fs.mkdirSync(path.join(tmpDir, '.agents'));
    const result = await detect(tmpDir);
    expect(result).toEqual(['codex']);
  });

  it('両方存在する場合は ["claude-code", "codex"] を返す', async () => {
    fs.mkdirSync(path.join(tmpDir, '.claude'));
    fs.mkdirSync(path.join(tmpDir, '.agents'));
    const result = await detect(tmpDir);
    expect(result).toEqual(['claude-code', 'codex']);
  });

  it('どちらも存在しない場合はデフォルトの ["claude-code"] を返す', async () => {
    const result = await detect(tmpDir);
    expect(result).toEqual(['claude-code']);
  });
});
