import { describe, expect, it } from 'vitest';
import { projectSpec } from '../src/projector';
import { dailyReportSpec, noUiSpec } from './fixtures';

describe('projectSpec', () => {
  it('projects form, list, and detail views into UI confirmation items', () => {
    const projection = projectSpec(dailyReportSpec());

    const uiItems = projection.items.filter((item) => item.kind === 'ui');

    expect(uiItems.map((item) => item.id)).toEqual([
      'view-reportForm',
      'view-reportList',
      'view-reportDetail'
    ]);
    expect(uiItems.map((item) => item.label)).toEqual(['日報入力', '日報一覧', '日報詳細']);
    expect(uiItems.every((item) => item.summary.length > 0)).toBe(true);
    expect(JSON.stringify(uiItems)).not.toContain('spec.json');
  });

  it('projects database/backend, logic/flows, and unknown sections into non-UI items', () => {
    const projection = projectSpec(dailyReportSpec());

    const nonUiItems = projection.items.filter((item) => item.kind === 'non-ui');

    expect(nonUiItems.map((item) => item.id)).toEqual([
      'non-ui-backend',
      'non-ui-logic',
      'non-ui-unclassified'
    ]);
    expect(nonUiItems[0]).toMatchObject({ label: 'DB・バックエンド' });
    expect(nonUiItems[1]).toMatchObject({ label: 'ロジック' });
    expect(nonUiItems[2]).toMatchObject({ label: '未分類仕様' });
  });

  it('keeps an observable UI empty state when no UI view exists', () => {
    const projection = projectSpec(noUiSpec());

    expect(projection.items[0]).toMatchObject({
      id: 'view-empty',
      kind: 'ui',
      label: 'UIビュー未定義'
    });
    expect(projection.items.some((item) => item.kind === 'non-ui')).toBe(true);
  });

  it('produces deterministic projections for the same spec', () => {
    expect(projectSpec(dailyReportSpec())).toEqual(projectSpec(dailyReportSpec()));
  });
});
