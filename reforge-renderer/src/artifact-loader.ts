import { createHash } from 'node:crypto';
import { readFile, realpath } from 'node:fs/promises';
import { dirname, extname, isAbsolute, join, normalize, relative, resolve } from 'node:path';
import type { LoadError, ReforgeSpec } from './types';

export interface PrototypeArtifact {
  html: string;
  relativePath: string;
  digest: string;
}

export type PrototypeArtifactResult =
  | { ok: true; artifact?: PrototypeArtifact }
  | { ok: false; error: LoadError };

export async function loadPrototypeArtifact(
  cwd: string,
  specPath: string,
  spec: ReforgeSpec
): Promise<PrototypeArtifactResult> {
  const artifactPath = spec.uiArtifacts?.prototype;
  if (!artifactPath || spec.uiArtifacts?.mode !== 'locked') {
    return { ok: true };
  }

  const resolved = await resolvePrototypeArtifactPath(cwd, specPath, artifactPath);
  if (!resolved.ok) {
    return {
      ok: false,
      error: {
        code: 'READ_ERROR',
        message: resolved.message
      }
    };
  }

  try {
    const html = await readFile(resolved.absolutePath, 'utf8');
    return {
      ok: true,
      artifact: {
        html,
        relativePath: resolved.relativePath,
        digest: createHash('sha256').update(html).digest('hex')
      }
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'READ_ERROR',
        message: `固定 Prototype Artifact HTML を読み込めません: ${(error as Error).message}`
      }
    };
  }
}

async function resolvePrototypeArtifactPath(
  cwd: string,
  specPath: string,
  artifactPath: string
): Promise<{ ok: true; absolutePath: string; relativePath: string } | { ok: false; message: string }> {
  if (isAbsolute(artifactPath)) {
    return {
      ok: false,
      message: '`uiArtifacts.prototype` は移植性のため相対パスで指定してください'
    };
  }

  const normalizedArtifact = normalize(artifactPath).replace(/\\/g, '/');
  const specDirRelative = dirname(specPath);
  const specDirAbsolute = resolve(cwd, specDirRelative);
  const targetAbsolute = normalizedArtifact.startsWith('.reforge/')
    ? resolve(cwd, normalizedArtifact)
    : resolve(specDirAbsolute, normalizedArtifact);
  const relativeToSpecDir = relative(specDirAbsolute, targetAbsolute);

  if (relativeToSpecDir.startsWith('..') || isAbsolute(relativeToSpecDir)) {
    return {
      ok: false,
      message: '`uiArtifacts.prototype` は spec ディレクトリ配下の HTML ファイルを指す必要があります'
    };
  }

  const extension = extname(targetAbsolute).toLowerCase();
  if (extension !== '.html' && extension !== '.htm') {
    return {
      ok: false,
      message: '`uiArtifacts.prototype` は .html または .htm ファイルを指す必要があります'
    };
  }

  let realSpecDirAbsolute: string;
  let realTargetAbsolute: string;
  try {
    [realSpecDirAbsolute, realTargetAbsolute] = await Promise.all([
      realpath(specDirAbsolute),
      realpath(targetAbsolute)
    ]);
  } catch (error) {
    return {
      ok: false,
      message: `固定 Prototype Artifact HTML を読み込めません: ${(error as Error).message}`
    };
  }

  const realRelativeToSpecDir = relative(realSpecDirAbsolute, realTargetAbsolute);
  if (realRelativeToSpecDir.startsWith('..') || isAbsolute(realRelativeToSpecDir)) {
    return {
      ok: false,
      message: '`uiArtifacts.prototype` は spec ディレクトリ配下の HTML ファイルを指す必要があります'
    };
  }

  const realExtension = extname(realTargetAbsolute).toLowerCase();
  if (realExtension !== '.html' && realExtension !== '.htm') {
    return {
      ok: false,
      message: '`uiArtifacts.prototype` は .html または .htm ファイルを指す必要があります'
    };
  }

  return {
    ok: true,
    absolutePath: realTargetAbsolute,
    relativePath: normalize(join(specDirRelative, realRelativeToSpecDir)).replace(/\\/g, '/')
  };
}
