import type { InstallResult, ReporterOptions, TargetEnvironment } from './types';

export function report(result: InstallResult, options?: ReporterOptions): void {
  const stdout = options?.stdout ?? process.stdout;
  const stderr = options?.stderr ?? process.stderr;

  if (!result.success) {
    const errorMsg = result.error
      ? `Error: ${result.error.reason} (path: ${result.error.path})\n`
      : 'Error: Installation failed.\n';
    stderr.write(errorMsg);
    return;
  }

  const lines: string[] = [];
  const environments = Object.keys(result.forwardingInstalled) as TargetEnvironment[];

  lines.push('');
  lines.push('✅ Reforge installed successfully!');
  lines.push('');

  lines.push('Installed:');
  if (environments.includes('claude')) {
    lines.push('  .claude/skills/');
  }
  if (environments.includes('codex')) {
    lines.push('  .agents/skills/');
  }
  lines.push('');

  if (environments.includes('claude')) {
    lines.push('Claude Code:');
    lines.push('  use /reforge-init, /reforge-status, /reforge-resume, ...');
    lines.push('');
  }

  if (environments.includes('codex')) {
    lines.push('Codex:');
    lines.push('  use /skills or $ to select reforge-init, reforge-status, reforge-resume, ...');
    lines.push('');
  }

  lines.push('Note:');
  lines.push('  Reforge keeps the same workflow concepts across agents,');
  lines.push('  but invocation UI differs by environment.');
  lines.push('');

  if (result.overwritten.length > 0) {
    lines.push('Overwritten files:');
    for (const file of result.overwritten) {
      lines.push(`  - ${file}`);
    }
    lines.push('');
  }

  stdout.write(lines.join('\n') + '\n');
}
