import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createReforgeServer } from '../src/server';
import { createWatcher } from '../src/watcher';
import { dailyReportSpec } from './fixtures';

const servers: Array<{ stop(): Promise<void> }> = [];

async function makeWorkspace(): Promise<string> {
  const cwd = await mkdtemp(join(tmpdir(), 'reforge-server-'));
  await mkdir(join(cwd, '.reforge/specs/daily-report'), { recursive: true });
  await writeFile(
    join(cwd, '.reforge/specs/daily-report/spec.json'),
    JSON.stringify(dailyReportSpec())
  );
  return cwd;
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.stop()));
});

describe('HttpServer', () => {
  it('serves the rendered confirmation UI and 404s unknown routes', async () => {
    const cwd = await makeWorkspace();
    const server = createReforgeServer();
    servers.push(server);
    const address = await server.start({ cwd, port: 0 });

    const root = await fetch(`${address.url}/`);
    const missing = await fetch(`${address.url}/missing`);

    expect(root.status).toBe(200);
    expect(root.headers.get('content-type')).toContain('text/html');
    expect(root.headers.get('x-reforge-render-mode')).toBe('spec-preview');
    expect(await root.text()).toContain('Spec Preview');
    expect(missing.status).toBe(404);
  });

  it('serves a locked prototype artifact when uiArtifacts.prototype is set', async () => {
    const cwd = await makeWorkspace();
    await writeFile(
      join(cwd, '.reforge/specs/daily-report/prototype.html'),
      '<!doctype html><html><body><main>Locked Prototype</main></body></html>'
    );
    await writeFile(
      join(cwd, '.reforge/specs/daily-report/spec.json'),
      JSON.stringify({
        ...dailyReportSpec(),
        uiArtifacts: {
          mode: 'locked',
          prototype: 'prototype.html'
        }
      })
    );
    const server = createReforgeServer();
    servers.push(server);
    const address = await server.start({ cwd, port: 0 });

    const root = await fetch(`${address.url}/`);

    expect(root.status).toBe(200);
    expect(root.headers.get('x-reforge-render-mode')).toBe('prototype-artifact');
    expect(root.headers.get('x-reforge-prototype-artifact')).toBe(
      '.reforge/specs/daily-report/prototype.html'
    );
    expect(await root.text()).toContain('Locked Prototype');
  });

  it('percent-encodes prototype artifact path headers for non-Latin-1 paths', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'reforge-server-'));
    const specName = '日本語-spec';
    const fileName = 'プロトタイプ.html';
    await mkdir(join(cwd, '.reforge/specs', specName), { recursive: true });
    await writeFile(
      join(cwd, '.reforge/specs', specName, fileName),
      '<!doctype html><html><body><main>Locked Prototype</main></body></html>'
    );
    await writeFile(
      join(cwd, '.reforge/specs', specName, 'spec.json'),
      JSON.stringify({
        ...dailyReportSpec(),
        uiArtifacts: {
          mode: 'locked',
          prototype: fileName
        }
      })
    );
    const server = createReforgeServer();
    servers.push(server);
    const address = await server.start({ cwd, port: 0, spec: specName });

    const root = await fetch(`${address.url}/`);
    const expectedPath = `.reforge/specs/${encodeURIComponent(specName)}/${encodeURIComponent(
      fileName
    )}`;

    expect(root.status).toBe(200);
    expect(root.headers.get('x-reforge-prototype-artifact')).toBe(expectedPath);
    expect(root.headers.get('x-reforge-artifact-path')).toBe(expectedPath);
    expect(await root.text()).toContain('Locked Prototype');
  });

  it.each(['generated', 'stale'] as const)(
    'falls back to the spec preview for %s prototype artifacts',
    async (mode) => {
      const cwd = await makeWorkspace();
      await writeFile(
        join(cwd, '.reforge/specs/daily-report/prototype.html'),
        '<!doctype html><html><body><main>Stale Prototype</main></body></html>'
      );
      await writeFile(
        join(cwd, '.reforge/specs/daily-report/spec.json'),
        JSON.stringify({
          ...dailyReportSpec(),
          uiArtifacts: {
            mode,
            prototype: 'prototype.html'
          }
        })
      );
      const server = createReforgeServer();
      servers.push(server);
      const address = await server.start({ cwd, port: 0 });

      const root = await fetch(`${address.url}/`);
      const html = await root.text();

      expect(root.status).toBe(200);
      expect(root.headers.get('x-reforge-render-mode')).toBe('spec-preview');
      expect(html).toContain('Spec Preview');
      expect(html).not.toContain('Stale Prototype');
    }
  );

  it('rejects prototype artifacts outside the spec directory', async () => {
    const cwd = await makeWorkspace();
    await writeFile(
      join(cwd, '.reforge/specs/daily-report/spec.json'),
      JSON.stringify({
        ...dailyReportSpec(),
        uiArtifacts: {
          mode: 'locked',
          prototype: '../outside.html'
        }
      })
    );
    const server = createReforgeServer();
    servers.push(server);
    const address = await server.start({ cwd, port: 0 });

    const root = await fetch(`${address.url}/`);
    const html = await root.text();

    expect(root.status).toBe(500);
    expect(html).toContain('spec ディレクトリ配下');
  });

  it('rejects prototype artifact symlinks that resolve outside the spec directory', async () => {
    const cwd = await makeWorkspace();
    await writeFile(join(cwd, 'outside.html'), '<!doctype html><html><body>Outside</body></html>');
    await symlink(
      join(cwd, 'outside.html'),
      join(cwd, '.reforge/specs/daily-report/prototype.html')
    );
    await writeFile(
      join(cwd, '.reforge/specs/daily-report/spec.json'),
      JSON.stringify({
        ...dailyReportSpec(),
        uiArtifacts: {
          mode: 'locked',
          prototype: 'prototype.html'
        }
      })
    );
    const server = createReforgeServer();
    servers.push(server);
    const address = await server.start({ cwd, port: 0 });

    const root = await fetch(`${address.url}/`);
    const html = await root.text();

    expect(root.status).toBe(500);
    expect(html).toContain('spec ディレクトリ配下');
  });

  it('rejects a locked prototype artifact when the approved digest does not match', async () => {
    const cwd = await makeWorkspace();
    const artifactHtml = '<!doctype html><html><body><main>Locked Prototype</main></body></html>';
    await writeFile(join(cwd, '.reforge/specs/daily-report/prototype.html'), artifactHtml);
    await writeFile(
      join(cwd, '.reforge/specs/daily-report/spec.json'),
      JSON.stringify({
        ...dailyReportSpec(),
        meta: {
          ...dailyReportSpec().meta,
          approved: true
        },
        uiArtifacts: {
          mode: 'locked',
          prototype: 'prototype.html',
          approvedDigest: `sha256:${createHash('sha256').update('older').digest('hex')}`
        }
      })
    );
    const server = createReforgeServer();
    servers.push(server);
    const address = await server.start({ cwd, port: 0 });

    const root = await fetch(`${address.url}/`);
    const html = await root.text();

    expect(root.status).toBe(500);
    expect(html).toContain('approvedDigest');
  });

  it('serves a stale locked prototype artifact for review after approval is reset', async () => {
    const cwd = await makeWorkspace();
    const artifactHtml = '<!doctype html><html><body><main>Updated Prototype</main></body></html>';
    await writeFile(join(cwd, '.reforge/specs/daily-report/prototype.html'), artifactHtml);
    await writeFile(
      join(cwd, '.reforge/specs/daily-report/spec.json'),
      JSON.stringify({
        ...dailyReportSpec(),
        meta: {
          ...dailyReportSpec().meta,
          approved: false
        },
        uiArtifacts: {
          mode: 'locked',
          prototype: 'prototype.html',
          approvedDigest: `sha256:${createHash('sha256').update('older').digest('hex')}`
        }
      })
    );
    const server = createReforgeServer();
    servers.push(server);
    const address = await server.start({ cwd, port: 0 });

    const root = await fetch(`${address.url}/`);
    const html = await root.text();

    expect(root.status).toBe(200);
    expect(root.headers.get('x-reforge-render-mode')).toBe('prototype-artifact');
    expect(html).toContain('Updated Prototype');
  });

  it('stops accepting connections after stop()', async () => {
    const cwd = await makeWorkspace();
    const server = createReforgeServer();
    const address = await server.start({ cwd, port: 0 });
    await server.stop();

    await expect(fetch(`${address.url}/`)).rejects.toThrow();
  });

  it('sends reload and error messages to SSE clients', async () => {
    const cwd = await makeWorkspace();
    const server = createReforgeServer();
    servers.push(server);
    const address = await server.start({ cwd, port: 0 });

    const response = await fetch(`${address.url}/reload-stream`);
    const reader = response.body?.getReader();
    expect(response.headers.get('content-type')).toContain('text/event-stream');
    expect(reader).toBeTruthy();

    server.notifyReload();
    const reload = await reader!.read();
    expect(new TextDecoder().decode(reload.value)).toContain('data: reload');

    server.notifyError('bad json');
    const error = await reader!.read();
    expect(new TextDecoder().decode(error.value)).toContain('data: error:bad json');

    await reader!.cancel();
  });
});

describe('FileWatcher', () => {
  it('notifies once for a saved file and stops cleanly', async () => {
    const cwd = await makeWorkspace();
    const specPath = join(cwd, '.reforge/specs/daily-report/spec.json');
    const watcher = createWatcher();
    let changes = 0;
    watcher.onChange(() => {
      changes += 1;
    });

    watcher.start(specPath, { debounceMs: 40 });
    await new Promise((resolve) => setTimeout(resolve, 80));
    await writeFile(specPath, JSON.stringify({ ...dailyReportSpec(), extra: true }));
    await new Promise((resolve) => setTimeout(resolve, 160));
    await watcher.stop();

    expect(changes).toBe(1);
  });

  it('triggers onChange with default debounce (150ms) when no debounceMs is specified', async () => {
    const cwd = await makeWorkspace();
    const specPath = join(cwd, '.reforge/specs/daily-report/spec.json');
    const watcher = createWatcher();
    let changes = 0;
    watcher.onChange(() => {
      changes += 1;
    });

    watcher.start(specPath); // uses default 150ms debounce
    await new Promise((resolve) => setTimeout(resolve, 80));
    await writeFile(specPath, JSON.stringify({ ...dailyReportSpec(), updated: true }));
    await new Promise((resolve) => setTimeout(resolve, 500)); // wait > 150ms default
    await watcher.stop();

    expect(changes).toBe(1);
  });
});
