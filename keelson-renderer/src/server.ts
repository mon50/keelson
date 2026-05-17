import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { loadPrototypeArtifact } from './artifact-loader';
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

export interface KeelsonServer {
  start(config: ServerConfig): Promise<ServerAddress>;
  notifyReload(): void;
  notifyError(message: string): void;
  stop(): Promise<void>;
}

export function createKeelsonServer(): KeelsonServer {
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

    const artifact = await loadPrototypeArtifact(cwd, result.specPath, result.spec);
    if (!artifact.ok) {
      res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(renderErrorPage(artifact.error.message));
      return;
    }
    if (
      artifact.artifact &&
      result.spec.meta.approved === true &&
      result.spec.uiArtifacts?.mode === 'locked' &&
      result.spec.uiArtifacts.approvedDigest &&
      !digestMatches(result.spec.uiArtifacts.approvedDigest, artifact.artifact.digest)
    ) {
      res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(
        renderErrorPage(
          '`uiArtifacts.approvedDigest` が Prototype Artifact のHTMLと一致しません。再生成または再承認してください。'
        )
      );
      return;
    }

    const html = artifact.artifact?.html ?? renderSpecProjection(projectSpec(result.spec));
    const artifactHeaderPath = artifact.artifact
      ? encodePathHeader(artifact.artifact.relativePath)
      : undefined;
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Keelson-Render-Mode': artifact.artifact ? 'prototype-artifact' : 'spec-preview',
      ...(artifact.artifact
        ? {
            'X-Keelson-Prototype-Artifact': artifactHeaderPath,
            'X-Keelson-Artifact-Path': artifactHeaderPath,
            'X-Keelson-Prototype-Digest': artifact.artifact.digest
          }
        : {})
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

function digestMatches(expected: string, actual: string): boolean {
  const normalized = expected.startsWith('sha256:') ? expected.slice('sha256:'.length) : expected;
  return normalized === actual;
}

function encodePathHeader(relativePath: string): string {
  return relativePath.split('/').map(encodeURIComponent).join('/');
}

function renderErrorPage(message: string): string {
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8"><title>Keelson render error</title></head><body><main><h1>Spec Preview / Prototype Artifact を表示できません</h1><p>${escapeHtml(
    message
  )}</p></main></body></html>`;
}
