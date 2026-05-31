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

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'keelson-installer-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('.claude/ のみ存在する環境で install() 後 .keelson/system/skills/keel-requirements/SKILL.md が存在する', async () => {
    await fse.ensureDir(path.join(tmpDir, '.claude'));

    const result = await install(tmpDir, { assets: makeAssets() });

    expect(result.success).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.keelson/system/skills/keel-requirements/SKILL.md'))).toBe(true);
  });

  it('.claude/ のみ存在する環境で install() 後 .claude/skills/keel-requirements/SKILL.md が存在する', async () => {
    await fse.ensureDir(path.join(tmpDir, '.claude'));

    const result = await install(tmpDir, { assets: makeAssets() });

    expect(result.success).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.claude/skills/keel-requirements/SKILL.md'))).toBe(true);
  });

  it('.claude/ のみ存在する環境で .agents/skills/ は生成されない', async () => {
    await fse.ensureDir(path.join(tmpDir, '.claude'));

    await install(tmpDir, { assets: makeAssets() });

    expect(fs.existsSync(path.join(tmpDir, '.agents/skills'))).toBe(false);
  });

  it('.claude/ のみ存在する場合は Claude Code のみに全スキルを配置する', async () => {
    await fse.ensureDir(path.join(tmpDir, '.claude'));

    const result = await install(tmpDir, { assets: makeAssets() });

    expect(result.success).toBe(true);
    expectForwarding(result.forwardingInstalled['claude-code']);
    expect(result.forwardingInstalled.codex).toBeUndefined();
    expectAllSkillsInstalled(tmpDir, '.claude');
    expectNoSkillsDir(tmpDir, '.agents');
  });

  it('.agents/ のみ存在する場合は Codex のみに全スキルを配置する', async () => {
    await fse.ensureDir(path.join(tmpDir, '.agents'));

    const result = await install(tmpDir, { assets: makeAssets() });

    expect(result.success).toBe(true);
    expect(result.forwardingInstalled['claude-code']).toBeUndefined();
    expectForwarding(result.forwardingInstalled.codex);
    expectNoSkillsDir(tmpDir, '.claude');
    expectAllSkillsInstalled(tmpDir, '.agents');
  });

  it('.claude/ と .agents/ の両方が存在する場合は両方に全スキルを配置する', async () => {
    await fse.ensureDir(path.join(tmpDir, '.claude'));
    await fse.ensureDir(path.join(tmpDir, '.agents'));

    const result = await install(tmpDir, { assets: makeAssets() });

    expect(result.success).toBe(true);
    expectForwarding(result.forwardingInstalled['claude-code']);
    expectForwarding(result.forwardingInstalled.codex);
    expectAllSkillsInstalled(tmpDir, '.claude');
    expectAllSkillsInstalled(tmpDir, '.agents');
  });

  it('どちらの環境ディレクトリも存在しない場合は Claude Code のみに全スキルを配置する', async () => {
    const result = await install(tmpDir, { assets: makeAssets() });

    expect(result.success).toBe(true);
    expectForwarding(result.forwardingInstalled['claude-code']);
    expect(result.forwardingInstalled.codex).toBeUndefined();
    expectAllSkillsInstalled(tmpDir, '.claude');
    expectNoSkillsDir(tmpDir, '.agents');
  });

  it('InstallResult.success === true が返る', async () => {
    await fse.ensureDir(path.join(tmpDir, '.claude'));

    const result = await install(tmpDir, { assets: makeAssets() });

    expect(result.success).toBe(true);
  });

  it('install() 後 .gitignore に .keelson/ が追加される', async () => {
    await fse.ensureDir(path.join(tmpDir, '.claude'));

    const result = await install(tmpDir, { assets: makeAssets() });

    expect(result.success).toBe(true);
    expect(fs.readFileSync(path.join(tmpDir, '.gitignore'), 'utf8')).toContain('.keelson/');
  });

  it('install() 後 .keelson/features/ が初期化される', async () => {
    const result = await install(tmpDir, { assets: makeAssets() });

    expect(result.success).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.keelson/features'))).toBe(true);
  });

  it('旧 .keelson/skills/ を新しい正本コピー後に削除する', async () => {
    await fse.ensureDir(path.join(tmpDir, '.keelson/skills/legacy-skill'));
    await fse.writeFile(path.join(tmpDir, '.keelson/skills/legacy-skill/SKILL.md'), 'legacy');

    const result = await install(tmpDir, { assets: makeAssets() });

    expect(result.success).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.keelson/skills'))).toBe(false);
    expect(fs.existsSync(path.join(tmpDir, '.keelson/system/skills/keel-requirements'))).toBe(true);
  });

  it('旧 .keelson/<feature>/ workspace を .keelson/features/<feature>/ に移動する', async () => {
    const legacyFeatureDir = path.join(tmpDir, '.keelson/team-invitations');
    await fse.ensureDir(legacyFeatureDir);
    await fse.writeJson(path.join(legacyFeatureDir, 'manifest.json'), { feature: 'team-invitations' });

    const result = await install(tmpDir, { assets: makeAssets() });

    expect(result.success).toBe(true);
    expect(fs.existsSync(legacyFeatureDir)).toBe(false);
    expect(fs.existsSync(path.join(tmpDir, '.keelson/features/team-invitations/manifest.json'))).toBe(
      true
    );
  });

  it("旧 .keelson/system/ workspace は feature 名 'system' として安全に移動する", async () => {
    const legacyFeatureDir = path.join(tmpDir, '.keelson/system');
    await fse.ensureDir(legacyFeatureDir);
    await fse.writeJson(path.join(legacyFeatureDir, 'manifest.json'), { feature: 'system' });

    const result = await install(tmpDir, { assets: makeAssets() });

    expect(result.success).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.keelson/features/system/manifest.json'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.keelson/system/skills/keel-requirements'))).toBe(true);
  });

  it('旧 workspace と新 workspace が衝突する場合はデータを上書きしない', async () => {
    const legacyFeatureDir = path.join(tmpDir, '.keelson/team-invitations');
    const featureDir = path.join(tmpDir, '.keelson/features/team-invitations');
    await fse.ensureDir(legacyFeatureDir);
    await fse.ensureDir(featureDir);
    await fse.writeJson(path.join(legacyFeatureDir, 'manifest.json'), { source: 'legacy' });
    await fse.writeJson(path.join(featureDir, 'manifest.json'), { source: 'current' });

    const result = await install(tmpDir, { assets: makeAssets() });

    expect(result.success).toBe(false);
    expect(result.error?.path).toBe(legacyFeatureDir);
    expect(await fse.readJson(path.join(legacyFeatureDir, 'manifest.json'))).toEqual({
      source: 'legacy'
    });
    expect(await fse.readJson(path.join(featureDir, 'manifest.json'))).toEqual({
      source: 'current'
    });
  });

  it('既存 .gitignore に .keelson がある場合は重複追加しない', async () => {
    await fse.ensureDir(path.join(tmpDir, '.claude'));
    await fse.writeFile(path.join(tmpDir, '.gitignore'), 'node_modules/\n.keelson/\n');

    const result = await install(tmpDir, { assets: makeAssets() });
    const gitignore = fs.readFileSync(path.join(tmpDir, '.gitignore'), 'utf8');

    expect(result.success).toBe(true);
    expect(gitignore.match(/^\.keelson\/$/gm)).toHaveLength(1);
  });

  it('assets.coreSkillsDir が存在しない場合は InstallResult.success === false が返る（例外スローなし）', async () => {
    await fse.ensureDir(path.join(tmpDir, '.claude'));

    const assets = makeAssets({ coreSkillsDir: '/nonexistent/path/to/skills' });
    const result = await install(tmpDir, { assets });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('result.skillsInstalled に全スキルが含まれる', async () => {
    await fse.ensureDir(path.join(tmpDir, '.claude'));

    const result = await install(tmpDir, { assets: makeAssets() });

    expect(result.success).toBe(true);
    expect(result.skillsInstalled).toEqual([...ALL_SKILLS]);
  });

  it('コピー前に .keelson/system/skills を初期化し、コピー失敗でも例外を投げない', async () => {
    await fse.ensureDir(path.join(tmpDir, '.claude'));

    const assets = makeAssets({ coreSkillsDir: path.join(tmpDir, 'missing-skills') });
    const result = await install(tmpDir, { assets });

    expect(result.success).toBe(false);
    expect(result.error?.path).toBe(assets.coreSkillsDir);
    expect(fs.existsSync(path.join(tmpDir, '.keelson/system/skills'))).toBe(true);
  });

  it('install() 後 Claude Code に全スキルを登録する', async () => {
    await fse.ensureDir(path.join(tmpDir, '.claude'));

    const result = await install(tmpDir, { assets: makeAssets() });

    expect(result.success).toBe(true);
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

    expect(fs.existsSync(path.join(tmpDir, '.keelson/system/skills/keel-requirements/SKILL.md'))).toBe(true);
    expectAllSkillsInstalled(tmpDir, '.claude');
    expect(stdout.join('\n')).toContain('Available commands:');
  });
});
