#!/usr/bin/env node

import process from 'node:process';

import { install } from '../src/installer';
import { report } from '../src/reporter';

const MIN_NODE_MAJOR = 18;

export function checkNodeVersion(version: string, minMajor: number): boolean {
  const match = /^v?(\d+)(?:\.|$)/.exec(version);
  if (!match) {
    return false;
  }

  return Number(match[1]) >= minMajor;
}

export async function main(
  argv: readonly string[] = process.argv.slice(2),
  cwd: string = process.cwd()
): Promise<number> {
  if (!checkNodeVersion(process.version, MIN_NODE_MAJOR)) {
    console.error(
      `Reforge requires Node.js ${MIN_NODE_MAJOR} or newer. Current version: ${process.version}`
    );
    return 1;
  }

  const [command] = argv;
  if (command !== 'install') {
    console.error('Usage: reforge install');
    return 1;
  }

  const result = await install(cwd);
  report(result);
  return result.success ? 0 : 1;
}

if (require.main === module) {
  void main().then(
    (exitCode) => {
      process.exitCode = exitCode;
    },
    (error: unknown) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  );
}
