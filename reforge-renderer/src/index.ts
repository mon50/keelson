import { join } from 'node:path';
import { loadSpec, resolveSpecPath } from './loader';
import { createReforgeServer } from './server';
import { createWatcher } from './watcher';

export async function main(argv = process.argv.slice(2), cwd = process.cwd()): Promise<void> {
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log('Usage: reforge-render [--port <port>] [--spec <name-or-path>]');
    console.log('Starts a local specification confirmation UI from .reforge/specs/<name>/spec.json.');
    return;
  }

  const port = readPort(argv);
  const specArg = readValueArg(argv, '--spec');
  const initial = await loadSpec(cwd, specArg);
  if (!initial.ok) {
    console.error(initial.error.message);
    process.exitCode = 1;
    return;
  }

  const resolved = await resolveSpecPath(cwd, specArg);
  if (!resolved.ok) {
    console.error(resolved.error.message);
    process.exitCode = 1;
    return;
  }

  const server = createReforgeServer();
  const address = await server.start({ cwd, port, spec: specArg });
  const watcher = createWatcher();
  watcher.onChange(async () => {
    const result = await loadSpec(cwd, specArg);
    if (result.ok) {
      server.notifyReload();
    } else {
      server.notifyError(result.error.message);
    }
  });
  watcher.start(join(cwd, resolved.value.relativePath), { debounceMs: 150 });

  console.log(`Reforge renderer running at ${address.url}`);

  const stop = async () => {
    await watcher.stop();
    await server.stop();
  };
  process.once('SIGINT', () => {
    void stop().then(() => process.exit(0));
  });
  process.once('SIGTERM', () => {
    void stop().then(() => process.exit(0));
  });
}

function readPort(argv: string[]): number {
  const port = readValueArg(argv, '--port');
  if (port) {
    return Number(port);
  }
  return Number(process.env.REFORGE_RENDER_PORT || process.env.PORT || 4317);
}

function readValueArg(argv: string[], name: string): string | undefined {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : undefined;
}

if (require.main === module) {
  void main();
}

export * from './types';
export { loadSpec } from './loader';
export { projectSpec } from './projector';
export { renderSpecProjection } from './composer';
export { createReforgeServer } from './server';
export { createWatcher } from './watcher';
