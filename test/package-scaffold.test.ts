import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

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

describe('root keelson package scaffold', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'keelson-cli-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('defines the npm package boundary for npx keelson-cli install', () => {
    expect(packageJson.name).toBe('keelson-cli');
    expect(packageJson.bin).toEqual({ 'keelson': './dist/bin/cli.js' });
    expect(packageJson.files).toEqual([
      'dist',
      'skills/core',
      'skills/templates'
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

  it('runs the install subcommand through the package entrypoint', async () => {
    fs.mkdirSync(path.join(tmpDir, '.claude'));

    const stdout: string[] = [];
    const originalLog = console.log;
    const originalWrite = process.stdout.write;
    console.log = (...args: unknown[]) => stdout.push(args.join(' '));
    process.stdout.write = ((chunk: string | Uint8Array) => {
      stdout.push(String(chunk));
      return true;
    }) as typeof process.stdout.write;

    try {
      await expect(main(['install'], tmpDir)).resolves.toBe(0);
    } finally {
      console.log = originalLog;
      process.stdout.write = originalWrite;
    }

    expect(fs.existsSync(path.join(tmpDir, '.keelson/skills/keel-requirements/SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.claude/skills/keel-requirements/SKILL.md'))).toBe(true);
    expect(stdout.join('\n')).toContain('Available commands:');
    expect(stdout.join('\n')).toContain('/keel-requirements "<作りたい体験や機能>"');
  });

  it('returns exit code 1 and reports install errors to stderr', async () => {
    const fileCwd = path.join(tmpDir, 'not-a-directory');
    fs.writeFileSync(fileCwd, '');

    const stderr: string[] = [];
    const originalError = console.error;
    const originalWrite = process.stderr.write;
    console.error = (...args: unknown[]) => stderr.push(args.join(' '));
    process.stderr.write = ((chunk: string | Uint8Array) => {
      stderr.push(String(chunk));
      return true;
    }) as typeof process.stderr.write;

    try {
      await expect(main(['install'], fileCwd)).resolves.toBe(1);
    } finally {
      console.error = originalError;
      process.stderr.write = originalWrite;
    }

    expect(stderr.join('\n')).toContain('Error:');
    expect(stderr.join('\n')).toContain(fileCwd);
  });

  it('prints usage and returns exit code 1 for unsupported subcommands', async () => {
    const stderr: string[] = [];
    const originalError = console.error;
    console.error = (...args: unknown[]) => stderr.push(args.join(' '));

    try {
      await expect(main(['unknown-command'], tmpDir)).resolves.toBe(1);
    } finally {
      console.error = originalError;
    }

    expect(stderr.join('\n')).toContain('Usage: keelson [install');
  });
});
