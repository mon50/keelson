import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as fse from 'fs-extra';
import * as os from 'node:os';
import * as path from 'node:path';
import { main } from '../bin/cli';
import { install } from '../src/installer';
import { ALL_SKILLS } from '../src/types';
import type { PackageAssets, SkillName } from '../src/types';

const repoRoot = path.resolve(__dirname, '..');

function makeAssets(overrides?: Partial<PackageAssets>): PackageAssets {
  return {
    packageRoot: repoRoot,
    coreSkillsDir: path.join(repoRoot, 'skills/core'),
    templatesDir: path.join(repoRoot, 'skills/templates'),
    rendererServerDir: path.join(repoRoot, 'keelson-renderer/dist'),
    ...overrides
  };
}

function expectAllSkillsInstalled(cwd: string, rootDir: '.claude' | '.agents'): void {
  for (const skillName of ALL_SKILLS) {
    expect(fs.existsSync(path.join(cwd, rootDir, 'skills', skillName, 'SKILL.md'))).toBe(true);
  }
}

function expectNoSkillsDir(cwd: string, rootDir: '.claude' | '.agents'): void {
  expect(fs.existsSync(path.join(cwd, rootDir, 'skills'))).toBe(false);
}

function expectForwarding(resultSkills: readonly SkillName[] | undefined): void {
  expect(resultSkills).toEqual([...ALL_SKILLS]);
}

describe('install()', () => {
  let tmpDir: string;
  let fakeRendererDir: string;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'keelson-installer-'));
    fakeRendererDir = path.join(tmpDir, 'fake-renderer');
    await fse.ensureDir(fakeRendererDir);
    await fse.writeFile(path.join(fakeRendererDir, 'index.js'), '// renderer');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('.claude/ のみ存在する環境で install() 後 .keelson/skills/keel-requirements/SKILL.md が存在する', async () => {
    await fse.ensureDir(path.join(tmpDir, '.claude'));

    const assets = makeAssets({ rendererServerDir: fakeRendererDir });
    const result = await install(tmpDir, { assets });

    expect(result.success).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.keelson/skills/keel-requirements/SKILL.md'))).toBe(true);
  });

  it('.claude/ のみ存在する環境で install() 後 .claude/skills/keel-requirements/SKILL.md が存在する', async () => {
    await fse.ensureDir(path.join(tmpDir, '.claude'));

    const assets = makeAssets({ rendererServerDir: fakeRendererDir });
    const result = await install(tmpDir, { assets });

    expect(result.success).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.claude/skills/keel-requirements/SKILL.md'))).toBe(true);
  });

  it('.claude/ のみ存在する環境で .agents/skills/ は生成されない', async () => {
    await fse.ensureDir(path.join(tmpDir, '.claude'));

    const assets = makeAssets({ rendererServerDir: fakeRendererDir });
    await install(tmpDir, { assets });

    expect(fs.existsSync(path.join(tmpDir, '.agents/skills'))).toBe(false);
  });

  it('.claude/ のみ存在する場合は Claude Code のみに全スキルを配置する', async () => {
    await fse.ensureDir(path.join(tmpDir, '.claude'));

    const assets = makeAssets({ rendererServerDir: fakeRendererDir });
    const result = await install(tmpDir, { assets });

    expect(result.success).toBe(true);
    expectForwarding(result.forwardingInstalled['claude-code']);
    expect(result.forwardingInstalled.codex).toBeUndefined();
    expectAllSkillsInstalled(tmpDir, '.claude');
    expectNoSkillsDir(tmpDir, '.agents');
  });

  it('.agents/ のみ存在する場合は Codex のみに全スキルを配置する', async () => {
    await fse.ensureDir(path.join(tmpDir, '.agents'));

    const assets = makeAssets({ rendererServerDir: fakeRendererDir });
    const result = await install(tmpDir, { assets });

    expect(result.success).toBe(true);
    expect(result.forwardingInstalled['claude-code']).toBeUndefined();
    expectForwarding(result.forwardingInstalled.codex);
    expectNoSkillsDir(tmpDir, '.claude');
    expectAllSkillsInstalled(tmpDir, '.agents');
  });

  it('.claude/ と .agents/ の両方が存在する場合は両方に全スキルを配置する', async () => {
    await fse.ensureDir(path.join(tmpDir, '.claude'));
    await fse.ensureDir(path.join(tmpDir, '.agents'));

    const assets = makeAssets({ rendererServerDir: fakeRendererDir });
    const result = await install(tmpDir, { assets });

    expect(result.success).toBe(true);
    expectForwarding(result.forwardingInstalled['claude-code']);
    expectForwarding(result.forwardingInstalled.codex);
    expectAllSkillsInstalled(tmpDir, '.claude');
    expectAllSkillsInstalled(tmpDir, '.agents');
  });

  it('どちらの環境ディレクトリも存在しない場合は Claude Code のみに全スキルを配置する', async () => {
    const assets = makeAssets({ rendererServerDir: fakeRendererDir });
    const result = await install(tmpDir, { assets });

    expect(result.success).toBe(true);
    expectForwarding(result.forwardingInstalled['claude-code']);
    expect(result.forwardingInstalled.codex).toBeUndefined();
    expectAllSkillsInstalled(tmpDir, '.claude');
    expectNoSkillsDir(tmpDir, '.agents');
  });

  it('InstallResult.success === true が返る', async () => {
    await fse.ensureDir(path.join(tmpDir, '.claude'));

    const assets = makeAssets({ rendererServerDir: fakeRendererDir });
    const result = await install(tmpDir, { assets });

    expect(result.success).toBe(true);
  });

  it('install() 後 .gitignore に .keelson/ が追加される', async () => {
    await fse.ensureDir(path.join(tmpDir, '.claude'));

    const assets = makeAssets({ rendererServerDir: fakeRendererDir });
    const result = await install(tmpDir, { assets });

    expect(result.success).toBe(true);
    expect(fs.readFileSync(path.join(tmpDir, '.gitignore'), 'utf8')).toContain('.keelson/');
  });

  it('既存 .gitignore に .keelson がある場合は重複追加しない', async () => {
    await fse.ensureDir(path.join(tmpDir, '.claude'));
    await fse.writeFile(path.join(tmpDir, '.gitignore'), 'node_modules/\n.keelson/\n');

    const assets = makeAssets({ rendererServerDir: fakeRendererDir });
    const result = await install(tmpDir, { assets });
    const gitignore = fs.readFileSync(path.join(tmpDir, '.gitignore'), 'utf8');

    expect(result.success).toBe(true);
    expect(gitignore.match(/^\.keelson\/$/gm)).toHaveLength(1);
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

  it('result.skillsInstalled に全スキルが含まれる', async () => {
    await fse.ensureDir(path.join(tmpDir, '.claude'));

    const assets = makeAssets({ rendererServerDir: fakeRendererDir });
    const result = await install(tmpDir, { assets });

    expect(result.success).toBe(true);
    expect(result.skillsInstalled).toEqual([...ALL_SKILLS]);
  });

  it('コピー前に .keelson/skills と .keelson/server を初期化し、コピー失敗でも例外を投げない', async () => {
    await fse.ensureDir(path.join(tmpDir, '.claude'));

    const assets = makeAssets({
      coreSkillsDir: path.join(tmpDir, 'missing-skills'),
      rendererServerDir: fakeRendererDir
    });
    const result = await install(tmpDir, { assets });

    expect(result.success).toBe(false);
    expect(result.error?.path).toBe(assets.coreSkillsDir);
    expect(fs.existsSync(path.join(tmpDir, '.keelson/skills'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.keelson/server'))).toBe(true);
  });

  it('install() 後 .keelson/server/index.js が存在し、Claude Code に全スキルを登録する', async () => {
    await fse.ensureDir(path.join(tmpDir, '.claude'));

    const assets = makeAssets({ rendererServerDir: fakeRendererDir });
    const result = await install(tmpDir, { assets });

    expect(result.success).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.keelson/server/index.js'))).toBe(true);
    expect(result.forwardingInstalled['claude-code']).toHaveLength(ALL_SKILLS.length);
  });

  it('main(["install"], cwd) が exit code 0 を返し、インストールを完了する', async () => {
    await fse.ensureDir(path.join(tmpDir, '.claude'));

    const stdout: string[] = [];
    const originalWrite = process.stdout.write;
    process.stdout.write = ((chunk: string | Uint8Array) => {
      stdout.push(String(chunk));
      return true;
    }) as typeof process.stdout.write;

    try {
      await expect(main(['install'], tmpDir)).resolves.toBe(0);
    } finally {
      process.stdout.write = originalWrite;
    }

    expect(fs.existsSync(path.join(tmpDir, '.keelson/skills/keel-requirements/SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.keelson/server/index.js'))).toBe(true);
    expectAllSkillsInstalled(tmpDir, '.claude');
    expect(stdout.join('\n')).toContain('Available commands:');
  });
});
