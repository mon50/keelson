import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { LoadResult, ReforgeSpec } from './types';

export const SPEC_RELATIVE_PATH = '.reforge/spec.json';

export async function loadSpec(cwd: string): Promise<LoadResult> {
  const specPath = join(cwd, SPEC_RELATIVE_PATH);
  let raw: string;

  try {
    raw = await readFile(specPath, 'utf8');
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === 'ENOENT') {
      return {
        ok: false,
        error: {
          code: 'NOT_FOUND',
          message: `.reforge/spec.json が見つかりません。先に /reforge:init を実行してください。`
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
    return { ok: true, spec: JSON.parse(raw) as ReforgeSpec };
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
