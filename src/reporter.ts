import type { InstallResult, ReporterOptions, TargetEnvironment } from './types';

interface CommandEntry {
  command: string;
  description: string;
}

const COMMANDS: CommandEntry[] = [
  { command: '/reforge:validate', description: 'spec.json を検証する' },
  { command: '/reforge:init',     description: 'プロダクト仕様を初期化する' },
  { command: '/reforge:resume',   description: '次の未回答質問を表示する' },
  { command: '/reforge:update',   description: '仕様に変更を適用する' },
  { command: '/reforge:diff',     description: '前後のspecの差分を表示する' },
  { command: '/reforge:plan',     description: '実装タスクを生成する' },
  { command: '/reforge:render',   description: 'UIプロトタイプを表示・承認する' },
  { command: '/reforge:impl',     description: 'エンティティを実装する' },
  { command: '/reforge:verify',   description: '実装と仕様の整合性を確認する' }
];

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

  // インストール完了メッセージ（環境・スキル数）
  const environments = Object.keys(result.forwardingInstalled) as TargetEnvironment[];
  const skillCount = result.skillsInstalled.length;
  lines.push('');
  lines.push('✅ Reforge installed successfully!');
  lines.push('');
  lines.push(`   Environments : ${environments.join(', ')}`);
  lines.push(`   Skills       : ${skillCount}`);

  // 上書きファイル一覧（存在する場合のみ）
  if (result.overwritten.length > 0) {
    lines.push('');
    lines.push('   Overwritten files:');
    for (const file of result.overwritten) {
      lines.push(`     - ${file}`);
    }
  }

  // 全9コマンドの一覧
  lines.push('');
  lines.push('Available commands:');
  lines.push('');
  const maxLen = Math.max(...COMMANDS.map(c => c.command.length));
  for (const entry of COMMANDS) {
    const padded = entry.command.padEnd(maxLen);
    lines.push(`   ${padded}   — ${entry.description}`);
  }

  // 次のステップ
  lines.push('');
  lines.push('Next step:');
  lines.push('');
  lines.push('   /reforge:init "<プロダクトの説明>"');
  lines.push('');

  stdout.write(lines.join('\n') + '\n');
}
