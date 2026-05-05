import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as fse from 'fs-extra';
import * as os from 'node:os';
import * as path from 'node:path';
import { copyLocalSkills, copyRendererServer } from '../src/copier';
import type { PackageAssets } from '../src/types';

const coreSkillsDir = path.resolve(__dirname, '../skills/core');

function makeAssets(overrides?: Partial<PackageAssets>): PackageAssets {
  return {
    packageRoot: path.resolve(__dirname, '..'),
    coreSkillsDir,
    templatesDir: path.resolve(__dirname, '../skills/templates'),
    rendererServerEntry: path.resolve(__dirname, '../reforge-renderer/server.js'),
    ...overrides
  };
}

describe('copyLocalSkills()', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reforge-copier-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('コピー後に .reforge/skills/reforge-init/SKILL.md が存在する', async () => {
    const assets = makeAssets();
    await copyLocalSkills(tmpDir, assets);
    const skillMd = path.join(tmpDir, '.reforge/skills/reforge-init/SKILL.md');
    expect(fs.existsSync(skillMd)).toBe(true);
  });

  it('9スキルすべてが .reforge/skills/ 配下にコピーされる', async () => {
    const assets = makeAssets();
    await copyLocalSkills(tmpDir, assets);
    const skillsDir = path.join(tmpDir, '.reforge/skills');
    const dirs = fs.readdirSync(skillsDir).filter((entry) => {
      return fs.statSync(path.join(skillsDir, entry)).isDirectory();
    });
    expect(dirs.length).toBe(9);
  });

  it('正常完了時は result.overwritten が配列で result.error が undefined', async () => {
    const assets = makeAssets();
    const result = await copyLocalSkills(tmpDir, assets);
    expect(Array.isArray(result.overwritten)).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('coreSkillsDir が存在しない場合は result.error が設定される（例外スローなし）', async () => {
    const assets = makeAssets({ coreSkillsDir: '/nonexistent/path/to/skills' });
    const result = await copyLocalSkills(tmpDir, assets);
    expect(result.error).toBeDefined();
    expect(result.error?.path).toBeTruthy();
    expect(result.error?.reason).toBeTruthy();
  });
});

describe('copyRendererServer()', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reforge-copier-renderer-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('コピー後に .reforge/server/index.js が存在する', async () => {
    const fakeRendererDir = path.join(tmpDir, 'fake-renderer');
    await fse.ensureDir(fakeRendererDir);
    await fse.writeFile(path.join(fakeRendererDir, 'index.js'), '// renderer');

    const assets: PackageAssets = {
      packageRoot: '',
      coreSkillsDir: '',
      templatesDir: '',
      rendererServerEntry: fakeRendererDir
    };

    const cwd = path.join(tmpDir, 'project');
    await fse.ensureDir(cwd);
    const result = await copyRendererServer(cwd, assets);

    expect(result.error).toBeUndefined();
    expect(fs.existsSync(path.join(cwd, '.reforge/server/index.js'))).toBe(true);
  });

  it('rendererServerEntry が存在しない場合は result.error が設定される（例外スローなし）', async () => {
    const assets: PackageAssets = {
      packageRoot: '',
      coreSkillsDir: '',
      templatesDir: '',
      rendererServerEntry: '/nonexistent/renderer/dist'
    };

    const cwd = path.join(tmpDir, 'project');
    await fse.ensureDir(cwd);
    const result = await copyRendererServer(cwd, assets);

    expect(result.error).toBeDefined();
    expect(result.error?.path).toBeTruthy();
    expect(result.error?.reason).toBeTruthy();
  });
});
