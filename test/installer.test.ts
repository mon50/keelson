import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as fse from 'fs-extra';
import * as os from 'node:os';
import * as path from 'node:path';
import { install } from '../src/installer';
import type { PackageAssets } from '../src/types';

const repoRoot = path.resolve(__dirname, '..');

function makeAssets(overrides?: Partial<PackageAssets>): PackageAssets {
  return {
    packageRoot: repoRoot,
    coreSkillsDir: path.join(repoRoot, 'skills/core'),
    templatesDir: path.join(repoRoot, 'skills/templates'),
    rendererServerDir: path.join(repoRoot, 'reforge-renderer/dist'),
    ...overrides
  };
}

describe('install()', () => {
  let tmpDir: string;
  let fakeRendererDir: string;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reforge-installer-'));
    fakeRendererDir = path.join(tmpDir, 'fake-renderer');
    await fse.ensureDir(fakeRendererDir);
    await fse.writeFile(path.join(fakeRendererDir, 'index.js'), '// renderer');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('.claude/ のみ存在する環境で install() 後 .reforge/skills/reforge-init/SKILL.md が存在する', async () => {
    await fse.ensureDir(path.join(tmpDir, '.claude'));

    const assets = makeAssets({ rendererServerDir: fakeRendererDir });
    const result = await install(tmpDir, { assets });

    expect(result.success).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.reforge/skills/reforge-init/SKILL.md'))).toBe(true);
  });

  it('.claude/ のみ存在する環境で install() 後 .claude/skills/reforge-init/SKILL.md が存在する', async () => {
    await fse.ensureDir(path.join(tmpDir, '.claude'));

    const assets = makeAssets({ rendererServerDir: fakeRendererDir });
    const result = await install(tmpDir, { assets });

    expect(result.success).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.claude/skills/reforge-init/SKILL.md'))).toBe(true);
  });

  it('.claude/ のみ存在する環境で .agents/skills/ は生成されない', async () => {
    await fse.ensureDir(path.join(tmpDir, '.claude'));

    const assets = makeAssets({ rendererServerDir: fakeRendererDir });
    await install(tmpDir, { assets });

    expect(fs.existsSync(path.join(tmpDir, '.agents/skills'))).toBe(false);
  });

  it('InstallResult.success === true が返る', async () => {
    await fse.ensureDir(path.join(tmpDir, '.claude'));

    const assets = makeAssets({ rendererServerDir: fakeRendererDir });
    const result = await install(tmpDir, { assets });

    expect(result.success).toBe(true);
  });

  it('assets.coreSkillsDir が存在しない場合は InstallResult.success === false が返る（例外スローなし）', async () => {
    await fse.ensureDir(path.join(tmpDir, '.claude'));

    const assets = makeAssets({
      coreSkillsDir: '/nonexistent/path/to/skills',
      rendererServerDir: fakeRendererDir
    });

    const result = await install(tmpDir, { assets });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('result.skillsInstalled に9スキルすべてが含まれる', async () => {
    await fse.ensureDir(path.join(tmpDir, '.claude'));

    const assets = makeAssets({ rendererServerDir: fakeRendererDir });
    const result = await install(tmpDir, { assets });

    expect(result.success).toBe(true);
    expect(result.skillsInstalled).toHaveLength(9);
    const expected = [
      'reforge-init',
      'reforge-resume',
      'reforge-update',
      'reforge-diff',
      'reforge-plan',
      'reforge-validate',
      'reforge-render',
      'reforge-impl',
      'reforge-verify'
    ];
    for (const skill of expected) {
      expect(result.skillsInstalled).toContain(skill);
    }
  });

  it('コピー前に .reforge/skills と .reforge/server を初期化し、コピー失敗でも例外を投げない', async () => {
    await fse.ensureDir(path.join(tmpDir, '.claude'));

    const assets = makeAssets({
      coreSkillsDir: path.join(tmpDir, 'missing-skills'),
      rendererServerDir: fakeRendererDir
    });
    const result = await install(tmpDir, { assets });

    expect(result.success).toBe(false);
    expect(result.error?.path).toBe(assets.coreSkillsDir);
    expect(fs.existsSync(path.join(tmpDir, '.reforge/skills'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.reforge/server'))).toBe(true);
  });

  it('install() 後 .reforge/server/index.js が存在し、Claude Code に9スキルを登録する', async () => {
    await fse.ensureDir(path.join(tmpDir, '.claude'));

    const assets = makeAssets({ rendererServerDir: fakeRendererDir });
    const result = await install(tmpDir, { assets });

    expect(result.success).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.reforge/server/index.js'))).toBe(true);
    expect(result.forwardingInstalled['claude-code']).toHaveLength(9);
  });
});
