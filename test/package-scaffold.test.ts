import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { checkNodeVersion, main } from '../bin/cli';

const repoRoot = path.resolve(__dirname, '..');
const packageJson = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8')
) as {
  name: string;
  bin: Record<string, string>;
  files: string[];
  scripts: Record<string, string>;
  engines: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
};

describe('root reforge package scaffold', () => {
  it('defines the npm package boundary for npx reforge install', () => {
    expect(packageJson.name).toBe('reforge');
    expect(packageJson.bin).toEqual({ reforge: './dist/bin/cli.js' });
    expect(packageJson.files).toEqual([
      'dist',
      'skills/core',
      'skills/templates',
      'skills/runtime'
    ]);
  });

  it('declares installer build, test, runtime, and Node.js 18+ requirements', () => {
    expect(packageJson.scripts.build).toContain('tsc -p tsconfig.json');
    expect(packageJson.scripts.test).toBe('vitest run');
    expect(packageJson.engines.node).toBe('>=18');
    expect(packageJson.dependencies['fs-extra']).toMatch(/^\^11\./);
    expect(packageJson.devDependencies.typescript).toMatch(/^\^5\./);
    expect(packageJson.devDependencies.vitest).toBeDefined();
    expect(packageJson.devDependencies['@vercel/ncc']).toBeDefined();
  });

  it('accepts only Node.js versions that satisfy the installer runtime floor', () => {
    expect(checkNodeVersion('v18.0.0', 18)).toBe(true);
    expect(checkNodeVersion('v20.11.1', 18)).toBe(true);
    expect(checkNodeVersion('18.19.0', 18)).toBe(true);
    expect(checkNodeVersion('v17.9.1', 18)).toBe(false);
  });

  it('starts the install subcommand through the package entrypoint', async () => {
    const output: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
      output.push(args.join(' '));
    };

    try {
      await expect(main(['install'], repoRoot)).resolves.toBe(0);
    } finally {
      console.log = originalLog;
    }

    expect(output.join('\n')).toContain(`Starting Reforge installer in ${repoRoot}`);
  });
});
