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

async function writeNamedSpec(cwd: string, name: string, value: unknown): Promise<void> {
  await mkdir(join(cwd, '.reforge/specs', name), { recursive: true });
  await writeFile(join(cwd, '.reforge/specs', name, 'spec.json'), JSON.stringify(value));
}

afterEach(async () => {
  for (const dir of tempDirs.splice(0)) {
    await chmod(join(dir, '.reforge'), 0o700).catch(() => undefined);
  }
});

describe('loadSpec', () => {
  it('loads the only named spec from .reforge/specs', async () => {
    const cwd = await makeWorkspace();
    await writeNamedSpec(cwd, 'daily-report', { meta: { name: 'App' }, entities: {}, views: {} });

    const result = await loadSpec(cwd);

    expect(result).toMatchObject({ ok: true, spec: { meta: { name: 'App' } } });
    if (result.ok) {
      expect(result.specPath).toBe('.reforge/specs/daily-report/spec.json');
    }
  });

  it('loads an explicit spec name when multiple specs exist', async () => {
    const cwd = await makeWorkspace();
    await writeNamedSpec(cwd, 'daily-report', { meta: { name: 'Daily' } });
    await writeNamedSpec(cwd, 'photo-albums', { meta: { name: 'Photo' } });

    const result = await loadSpec(cwd, 'photo-albums');

    expect(result).toMatchObject({ ok: true, spec: { meta: { name: 'Photo' } } });
  });

  it('reports AMBIGUOUS_SPEC when multiple named specs exist and no spec is selected', async () => {
    const cwd = await makeWorkspace();
    await writeNamedSpec(cwd, 'daily-report', { meta: { name: 'Daily' } });
    await writeNamedSpec(cwd, 'photo-albums', { meta: { name: 'Photo' } });

    const result = await loadSpec(cwd);

    expect(result).toMatchObject({ ok: false, error: { code: 'AMBIGUOUS_SPEC' } });
  });

  it('falls back to legacy .reforge/spec.json when no named specs exist', async () => {
    const cwd = await makeWorkspace();
    await writeFile(
      join(cwd, '.reforge/spec.json'),
      JSON.stringify({ meta: { name: 'Legacy' }, entities: {}, views: {} })
    );

    const result = await loadSpec(cwd);

    expect(result).toMatchObject({ ok: true, spec: { meta: { name: 'Legacy' } } });
  });

  it('reports NOT_FOUND for a missing spec file', async () => {
    const cwd = await makeWorkspace();

    const result = await loadSpec(cwd);

    expect(result).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } });
    if (!result.ok) {
      expect(result.error.message).toContain('/reforge-init');
    }
  });

  it('reports PARSE_ERROR with the parser message for invalid JSON', async () => {
    const cwd = await makeWorkspace();
    await mkdir(join(cwd, '.reforge/specs/invalid-spec'), { recursive: true });
    await writeFile(join(cwd, '.reforge/specs/invalid-spec/spec.json'), '{ invalid');

    const result = await loadSpec(cwd, 'invalid-spec');

    expect(result).toMatchObject({ ok: false, error: { code: 'PARSE_ERROR' } });
    if (!result.ok) {
      expect(result.error.message).toContain('JSON');
    }
  });
});
