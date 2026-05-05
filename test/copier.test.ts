import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as fse from 'fs-extra';
import * as os from 'node:os';
import * as path from 'node:path';
import { copyLocalSkills, copyRendererServer, copyForwarders } from '../src/copier';
import type { PackageAssets } from '../src/types';

const coreSkillsDir = path.resolve(__dirname, '../skills/core');

function makeAssets(overrides?: Partial<PackageAssets>): PackageAssets {
  return {
    packageRoot: path.resolve(__dirname, '..'),
    coreSkillsDir,
    templatesDir: path.resolve(__dirname, '../skills/templates'),
    rendererServerDir: path.resolve(__dirname, '../reforge-renderer/server.js'),
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
      rendererServerDir: fakeRendererDir
    };

    const cwd = path.join(tmpDir, 'project');
    await fse.ensureDir(cwd);
    const result = await copyRendererServer(cwd, assets);

    expect(result.error).toBeUndefined();
    expect(fs.existsSync(path.join(cwd, '.reforge/server/index.js'))).toBe(true);
  });

  it('rendererServerDir が存在しない場合は result.error が設定される（例外スローなし）', async () => {
    const assets: PackageAssets = {
      packageRoot: '',
      coreSkillsDir: '',
      templatesDir: '',
      rendererServerDir: '/nonexistent/renderer/dist'
    };

    const cwd = path.join(tmpDir, 'project');
    await fse.ensureDir(cwd);
    const result = await copyRendererServer(cwd, assets);

    expect(result.error).toBeDefined();
    expect(result.error?.path).toBeTruthy();
    expect(result.error?.reason).toBeTruthy();
  });
});

describe('copyForwarders() - Claude Code', () => {
  let tmpDir: string;
  const assets: PackageAssets = {
    packageRoot: '',
    coreSkillsDir: '',
    rendererServerDir: '',
    templatesDir: path.resolve(__dirname, '../skills/templates')
  };

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reforge-copier-forwarders-cc-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('Claude Code 環境で copyForwarders を呼び出すと .claude/skills/reforge-init/SKILL.md が存在する', async () => {
    const result = await copyForwarders(tmpDir, 'claude-code', assets);
    expect(result.error).toBeUndefined();
    const skillMd = path.join(tmpDir, '.claude/skills/reforge-init/SKILL.md');
    expect(fs.existsSync(skillMd)).toBe(true);
  });

  it('9スキルすべてが .claude/skills/ に生成される', async () => {
    await copyForwarders(tmpDir, 'claude-code', assets);
    const skillsDir = path.join(tmpDir, '.claude/skills');
    const skillFiles: string[] = [];
    for (const entry of fs.readdirSync(skillsDir)) {
      const candidate = path.join(skillsDir, entry, 'SKILL.md');
      if (fs.existsSync(candidate)) {
        skillFiles.push(candidate);
      }
    }
    expect(skillFiles.length).toBe(9);
  });

  it('生成された SKILL.md がフォワーダー形式（.reforge/skills/reforge-init/SKILL.md を含む）', async () => {
    await copyForwarders(tmpDir, 'claude-code', assets);
    const skillMd = path.join(tmpDir, '.claude/skills/reforge-init/SKILL.md');
    const content = fs.readFileSync(skillMd, 'utf8');
    expect(content).toContain('.reforge/skills/reforge-init/SKILL.md');
  });

  it('既存ファイルを上書きした場合 result.overwritten にパスが含まれる', async () => {
    // 一度コピーしてファイルを作成
    await copyForwarders(tmpDir, 'claude-code', assets);
    // 再度コピーすると overwritten に含まれる
    const result = await copyForwarders(tmpDir, 'claude-code', assets);
    expect(result.error).toBeUndefined();
    const expectedPath = path.join(tmpDir, '.claude/skills/reforge-init/SKILL.md');
    expect(result.overwritten).toContain(expectedPath);
  });
});

describe('copyForwarders() - Codex', () => {
  let tmpDir: string;
  const assets: PackageAssets = {
    packageRoot: '',
    coreSkillsDir: '',
    rendererServerDir: '',
    templatesDir: path.resolve(__dirname, '../skills/templates')
  };

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reforge-copier-forwarders-cdx-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('Codex 環境で copyForwarders を呼び出すと .agents/skills/reforge-init/SKILL.md が存在する', async () => {
    const result = await copyForwarders(tmpDir, 'codex', assets);
    expect(result.error).toBeUndefined();
    const skillMd = path.join(tmpDir, '.agents/skills/reforge-init/SKILL.md');
    expect(fs.existsSync(skillMd)).toBe(true);
  });
});
