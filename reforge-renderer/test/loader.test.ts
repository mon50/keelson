import { mkdtemp, mkdir, writeFile, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadSpec } from '../src/loader';

const tempDirs: string[] = [];

async function makeWorkspace(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'reforge-loader-'));
  tempDirs.push(dir);
  await mkdir(join(dir, '.reforge'));
  return dir;
}

afterEach(async () => {
  for (const dir of tempDirs.splice(0)) {
    await chmod(join(dir, '.reforge'), 0o700).catch(() => undefined);
  }
});

describe('loadSpec', () => {
  it('loads .reforge/spec.json from the provided cwd', async () => {
    const cwd = await makeWorkspace();
    await writeFile(
      join(cwd, '.reforge/spec.json'),
      JSON.stringify({ meta: { name: 'App' }, entities: {}, views: {} })
    );

    const result = await loadSpec(cwd);

    expect(result).toMatchObject({ ok: true, spec: { meta: { name: 'App' } } });
  });

  it('reports NOT_FOUND for a missing spec file', async () => {
    const cwd = await makeWorkspace();

    const result = await loadSpec(cwd);

    expect(result).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } });
    if (!result.ok) {
      expect(result.error.message).toContain('/reforge:init');
    }
  });

  it('reports PARSE_ERROR with the parser message for invalid JSON', async () => {
    const cwd = await makeWorkspace();
    await writeFile(join(cwd, '.reforge/spec.json'), '{ invalid');

    const result = await loadSpec(cwd);

    expect(result).toMatchObject({ ok: false, error: { code: 'PARSE_ERROR' } });
    if (!result.ok) {
      expect(result.error.message).toContain('JSON');
    }
  });
});
