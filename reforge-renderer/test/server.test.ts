import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
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
    expect(await root.text()).toContain('仕様確認');
    expect(missing.status).toBe(404);
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
