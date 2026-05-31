import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { copyLocalSkills, copyForwarders } from '../src/copier';
import { ALL_SKILLS } from '../src/types';
import type { PackageAssets } from '../src/types';

const coreSkillsDir = path.resolve(__dirname, '../skills/core');

function makeAssets(overrides?: Partial<PackageAssets>): PackageAssets {
  return {
    packageRoot: path.resolve(__dirname, '..'),
    coreSkillsDir,
    templatesDir: path.resolve(__dirname, '../skills/templates'),
    ...overrides
  };
}

describe('copyLocalSkills()', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'keelson-copier-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('コピー後に .keelson/system/skills/keel-requirements/SKILL.md が存在する', async () => {
    const assets = makeAssets();
    await copyLocalSkills(tmpDir, assets);
    const skillMd = path.join(tmpDir, '.keelson/system/skills/keel-requirements/SKILL.md');
    expect(fs.existsSync(skillMd)).toBe(true);
  });

  it('全スキルが .keelson/system/skills/ 配下にコピーされる', async () => {
    const assets = makeAssets();
    await copyLocalSkills(tmpDir, assets);
    const skillsDir = path.join(tmpDir, '.keelson/system/skills');
    const dirs = fs.readdirSync(skillsDir).filter((entry) => {
      return fs.statSync(path.join(skillsDir, entry)).isDirectory();
    });
    expect(dirs.length).toBe(ALL_SKILLS.length);
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

describe('copyForwarders() - Claude Code', () => {
  let tmpDir: string;
  const assets: PackageAssets = {
    packageRoot: '',
    coreSkillsDir: '',
    templatesDir: path.resolve(__dirname, '../skills/templates')
  };

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'keelson-copier-forwarders-cc-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('Claude Code 環境で copyForwarders を呼び出すと .claude/skills/keel-requirements/SKILL.md が存在する', async () => {
    const result = await copyForwarders(tmpDir, 'claude-code', assets);
    expect(result.error).toBeUndefined();
    const skillMd = path.join(tmpDir, '.claude/skills/keel-requirements/SKILL.md');
    expect(fs.existsSync(skillMd)).toBe(true);
  });

  it('全スキルが .claude/skills/ に生成される', async () => {
    await copyForwarders(tmpDir, 'claude-code', assets);
    const skillsDir = path.join(tmpDir, '.claude/skills');
    const skillFiles: string[] = [];
    for (const entry of fs.readdirSync(skillsDir)) {
      const candidate = path.join(skillsDir, entry, 'SKILL.md');
      if (fs.existsSync(candidate)) {
        skillFiles.push(candidate);
      }
    }
    expect(skillFiles.length).toBe(ALL_SKILLS.length);
  });

  it('生成された SKILL.md がフォワーダー形式（.keelson/system/skills/keel-requirements/SKILL.md を含む）', async () => {
    await copyForwarders(tmpDir, 'claude-code', assets);
    const skillMd = path.join(tmpDir, '.claude/skills/keel-requirements/SKILL.md');
    const content = fs.readFileSync(skillMd, 'utf8');
    expect(content).toContain('.keelson/system/skills/keel-requirements/SKILL.md');
  });

  it('既存ファイルを上書きした場合 result.overwritten にパスが含まれる', async () => {
    await copyForwarders(tmpDir, 'claude-code', assets);
    const result = await copyForwarders(tmpDir, 'claude-code', assets);
    expect(result.error).toBeUndefined();
    const expectedPath = path.join(tmpDir, '.claude/skills/keel-requirements/SKILL.md');
    expect(result.overwritten).toContain(expectedPath);
  });
});

describe('copyForwarders() - Codex', () => {
  let tmpDir: string;
  const assets: PackageAssets = {
    packageRoot: '',
    coreSkillsDir: '',
    templatesDir: path.resolve(__dirname, '../skills/templates')
  };

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'keelson-copier-forwarders-cdx-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('Codex 環境で copyForwarders を呼び出すと .agents/skills/keel-requirements/SKILL.md が存在する', async () => {
    const result = await copyForwarders(tmpDir, 'codex', assets);
    expect(result.error).toBeUndefined();
    const skillMd = path.join(tmpDir, '.agents/skills/keel-requirements/SKILL.md');
    expect(fs.existsSync(skillMd)).toBe(true);
  });
});
