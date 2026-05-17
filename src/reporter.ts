import type { InstallResult, ReporterOptions, TargetEnvironment } from './types';
import { SKILL_COMMAND } from './types';

function slashCommand(command: string): string {
  return `/keelson-${command}`;
}

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
  lines.push('✅ Keelson installed successfully!');
  lines.push('');

  for (const env of environments) {
    const skills = result.forwardingInstalled[env] ?? [];
    lines.push(`${env} (${skills.length} skills):`);
    for (const skill of skills) {
      const cmd = SKILL_COMMAND[skill];
      lines.push(`  ${slashCommand(cmd)}`);
    }
    lines.push('');
  }

  lines.push('Available commands:');
  lines.push('  /keel-requirements "<作りたい体験や機能>"');
  lines.push('  /keel-us');
  lines.push('  /keel-design');
  lines.push('  /keel-proto');
  lines.push('  /keel-plan');
  lines.push('  /keel-impl');
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
