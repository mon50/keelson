import { watch, type FSWatcher } from 'chokidar';

export interface FileWatcher {
  start(filePath: string, options?: { debounceMs?: number }): void;
  stop(): Promise<void>;
  onChange(handler: () => void): void;
}

export function createWatcher(): FileWatcher {
  let watcher: FSWatcher | undefined;
  const handlers = new Set<() => void>();
  let timer: NodeJS.Timeout | undefined;

  function notify(debounceMs: number): void {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      for (const handler of handlers) {
        handler();
      }
    }, debounceMs);
  }

  return {
    start(filePath, options = {}) {
      const debounceMs = options.debounceMs ?? 150;
      watcher = watch(filePath, {
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: debounceMs,
          pollInterval: Math.max(10, Math.floor(debounceMs / 3))
        }
      });
      watcher.on('change', () => notify(debounceMs));
      watcher.on('add', () => notify(debounceMs));
    },

    async stop() {
      if (timer) {
        clearTimeout(timer);
        timer = undefined;
      }
      if (watcher) {
        await watcher.close();
        watcher = undefined;
      }
    },

    onChange(handler) {
      handlers.add(handler);
    }
  };
}
