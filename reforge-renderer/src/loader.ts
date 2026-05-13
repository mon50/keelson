import { readdir, readFile, stat } from 'node:fs/promises';
import { join, normalize } from 'node:path';
import type { LoadError, LoadResult, ReforgeSpec } from './types';

export const LEGACY_SPEC_RELATIVE_PATH = '.reforge/spec.json';
export const SPECS_RELATIVE_DIR = '.reforge/specs';

export interface ResolvedSpecPath {
  relativePath: string;
  absolutePath: string;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    const result = await stat(path);
    return result.isFile();
  } catch {
    return false;
  }
}

function normalizeRelative(path: string): string {
  return normalize(path).replace(/\\/g, '/');
}

async function listNamedSpecs(cwd: string): Promise<string[]> {
  const specsDir = join(cwd, SPECS_RELATIVE_DIR);
  try {
    const entries = await readdir(specsDir, { withFileTypes: true });
    const names: string[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }
      const relativePath = `${SPECS_RELATIVE_DIR}/${entry.name}/spec.json`;
      if (await fileExists(join(cwd, relativePath))) {
        names.push(entry.name);
      }
    }
    return names.sort((left, right) => left.localeCompare(right, 'en'));
  } catch {
    return [];
  }
}

export async function resolveSpecPath(
  cwd: string,
  specArg?: string
): Promise<{ ok: true; value: ResolvedSpecPath } | { ok: false; error: LoadError }> {
  if (specArg) {
    const relativePath =
      specArg.endsWith('.json') || specArg.includes('/')
        ? normalizeRelative(specArg)
        : `${SPECS_RELATIVE_DIR}/${specArg}/spec.json`;
    return {
      ok: true,
      value: {
        relativePath,
        absolutePath: join(cwd, relativePath)
      }
    };
  }

  const namedSpecs = await listNamedSpecs(cwd);
  if (namedSpecs.length === 1) {
    const relativePath = `${SPECS_RELATIVE_DIR}/${namedSpecs[0]}/spec.json`;
    return {
      ok: true,
      value: {
        relativePath,
        absolutePath: join(cwd, relativePath)
      }
    };
  }

  if (namedSpecs.length > 1) {
    return {
      ok: false,
      error: {
        code: 'AMBIGUOUS_SPEC',
        message: `複数の spec が見つかりました。--spec <name> を指定してください: ${namedSpecs.join(', ')}`
      }
    };
  }

  return {
    ok: true,
    value: {
      relativePath: LEGACY_SPEC_RELATIVE_PATH,
      absolutePath: join(cwd, LEGACY_SPEC_RELATIVE_PATH)
    }
  };
}

export async function loadSpec(cwd: string, specArg?: string): Promise<LoadResult> {
  const resolved = await resolveSpecPath(cwd, specArg);
  if (!resolved.ok) {
    return resolved;
  }

  let raw: string;

  try {
    raw = await readFile(resolved.value.absolutePath, 'utf8');
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === 'ENOENT') {
      return {
        ok: false,
        error: {
          code: 'NOT_FOUND',
          message: `${resolved.value.relativePath} が見つかりません。先に /reforge-init を実行してください。`
        }
      };
    }
    return {
      ok: false,
      error: {
        code: 'READ_ERROR',
        message: `Spec.Json を読み込めません: ${nodeError.message}`
      }
    };
  }

  try {
    return {
      ok: true,
      spec: JSON.parse(raw) as ReforgeSpec,
      specPath: resolved.value.relativePath
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'PARSE_ERROR',
        message: `Spec.Json は有効な JSON ではありません: ${(error as Error).message}`
      }
    };
  }
}
