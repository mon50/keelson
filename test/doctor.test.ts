import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'fs-extra';
import * as os from 'node:os';
import * as path from 'node:path';
import { doctor } from '../src/doctor';

describe('doctor()', () => {
  let tmpDir: string;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'keelson-doctor-'));
    await fs.ensureDir(path.join(tmpDir, '.git'));
    await fs.ensureDir(path.join(tmpDir, '.claude'));
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(async () => {
    logSpy.mockRestore();
    await fs.remove(tmpDir);
  });

  it('system directories are not treated as feature workspaces', async () => {
    await fs.ensureDir(path.join(tmpDir, '.keelson/system/skills'));
    await fs.ensureDir(path.join(tmpDir, '.keelson/steering'));

    await expect(doctor(tmpDir, true)).resolves.toBe(0);

    const report = JSON.parse(logSpy.mock.calls.at(-1)?.[0] as string) as {
      warnings: string[];
    };
    expect(report.warnings).toContain(
      'No Keelson feature manifests found. Start with `/keel-requirements "<idea>"`.'
    );
    expect(report.warnings).not.toContain("Feature workspace 'system' is missing manifest.json.");
    expect(report.warnings).not.toContain("Feature workspace 'steering' is missing manifest.json.");
  });

  it('validates workspaces under .keelson/features only', async () => {
    await fs.ensureDir(path.join(tmpDir, '.keelson/features/team-invitations'));

    await expect(doctor(tmpDir, true)).resolves.toBe(0);

    const report = JSON.parse(logSpy.mock.calls.at(-1)?.[0] as string) as {
      warnings: string[];
    };
    expect(report.warnings).toContain(
      "Feature workspace 'team-invitations' is missing manifest.json."
    );
  });
});
