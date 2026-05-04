import { join } from 'node:path';
import { SPEC_RELATIVE_PATH, loadSpec } from './loader';
import { createReforgeServer } from './server';
import { createWatcher } from './watcher';

export async function main(argv = process.argv.slice(2), cwd = process.cwd()): Promise<void> {
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log('Usage: reforge-render [--port <port>]');
    console.log('Starts a local specification confirmation UI from .reforge/spec.json.');
    return;
  }

  const port = readPort(argv);
  const initial = await loadSpec(cwd);
  if (!initial.ok) {
    console.error(initial.error.message);
    process.exitCode = 1;
    return;
  }

  const server = createReforgeServer();
  const address = await server.start({ cwd, port });
  const watcher = createWatcher();
  watcher.onChange(async () => {
    const result = await loadSpec(cwd);
    if (result.ok) {
      server.notifyReload();
    } else {
      server.notifyError(result.error.message);
    }
  });
  watcher.start(join(cwd, SPEC_RELATIVE_PATH), { debounceMs: 150 });

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
  const portIndex = argv.indexOf('--port');
  if (portIndex >= 0 && argv[portIndex + 1]) {
    return Number(argv[portIndex + 1]);
  }
  return Number(process.env.REFORGE_RENDER_PORT || process.env.PORT || 4317);
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
