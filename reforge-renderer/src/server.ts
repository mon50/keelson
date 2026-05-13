import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { loadSpec } from './loader';
import { projectSpec } from './projector';
import { renderSpecProjection } from './composer';
import { escapeHtml } from './utils';

export interface ServerConfig {
  port: number;
  cwd: string;
  spec?: string;
}

export interface ServerAddress {
  url: string;
  port: number;
}

export interface ReforgeServer {
  start(config: ServerConfig): Promise<ServerAddress>;
  notifyReload(): void;
  notifyError(message: string): void;
  stop(): Promise<void>;
}

export function createReforgeServer(): ReforgeServer {
  let server: Server | undefined;
  let cwd = process.cwd();
  let spec: string | undefined;
  const clients = new Set<ServerResponse>();

  async function handleRoot(res: ServerResponse): Promise<void> {
    const result = await loadSpec(cwd, spec);
    if (!result.ok) {
      res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(renderErrorPage(result.error.message));
      return;
    }

    const html = renderSpecProjection(projectSpec(result.spec));
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store'
    });
    res.end(html);
  }

  function handleSse(req: IncomingMessage, res: ServerResponse): void {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    });
    res.flushHeaders();
    clients.add(res);
    req.on('close', () => {
      clients.delete(res);
      res.end();
    });
  }

  function broadcast(data: string): void {
    for (const client of Array.from(clients)) {
      client.write(`data: ${data}\n\n`);
    }
  }

  return {
    start(config) {
      cwd = config.cwd;
      spec = config.spec;
      server = createServer((req, res) => {
        const url = new URL(req.url ?? '/', 'http://127.0.0.1');
        if (req.method === 'GET' && url.pathname === '/') {
          void handleRoot(res);
          return;
        }
        if (req.method === 'GET' && url.pathname === '/reload-stream') {
          handleSse(req, res);
          return;
        }
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
      });

      return new Promise((resolve, reject) => {
        server!.once('error', reject);
        server!.listen(config.port, '127.0.0.1', () => {
          const address = server!.address();
          const port = typeof address === 'object' && address ? address.port : config.port;
          resolve({ port, url: `http://127.0.0.1:${port}` });
        });
      });
    },

    notifyReload() {
      broadcast('reload');
    },

    notifyError(message) {
      broadcast(`error:${message.replace(/\n/g, ' ')}`);
    },

    async stop() {
      for (const client of Array.from(clients)) {
        client.end();
      }
      clients.clear();
      if (!server) {
        return;
      }
      await new Promise<void>((resolve, reject) => {
        server!.close((error) => (error ? reject(error) : resolve()));
      });
      server = undefined;
    }
  };
}

function renderErrorPage(message: string): string {
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8"><title>Reforge render error</title></head><body><main><h1>仕様確認UIを生成できません</h1><p>${escapeHtml(
    message
  )}</p></main></body></html>`;
}
