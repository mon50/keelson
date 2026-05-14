import { describe, expect, it } from 'vitest';
import { projectSpec } from '../src/projector';
import type { UiViewProjection } from '../src/types';
import { commerceSpec, dailyReportSpec, noUiSpec } from './fixtures';

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

  it('projects core, database/backend, logic/flows, and unknown sections into non-UI items', () => {
    const projection = projectSpec(dailyReportSpec());

    const nonUiItems = projection.items.filter((item) => item.kind === 'non-ui');

    expect(nonUiItems.map((item) => item.id)).toEqual([
      'non-ui-core',
      'non-ui-backend',
      'non-ui-logic',
      'non-ui-unclassified'
    ]);
    expect(nonUiItems[0]).toMatchObject({ label: '要件・文脈・技術' });
    expect(nonUiItems[1]).toMatchObject({ label: 'DB・バックエンド' });
    expect(nonUiItems[2]).toMatchObject({ label: 'ロジック' });
    expect(nonUiItems[3]).toMatchObject({ label: '未分類仕様' });
  });

  it('exposes requirements, context, and tech as protected approval context', () => {
    const spec = {
      ...dailyReportSpec(),
      context: {
        mode: 'brownfield',
        changeScope: {
          protectedAreas: ['billing']
        }
      },
      tech: {
        frontend: 'Next.js',
        backend: 'FastAPI'
      }
    };
    const projection = projectSpec(spec);
    const coreItem = projection.items.find((item) => item.id === 'non-ui-core');

    expect(coreItem).toMatchObject({
      kind: 'non-ui',
      sections: [
        { title: '要件' },
        { title: '文脈' },
        { title: '技術スタック' }
      ]
    });
    expect(JSON.stringify(coreItem)).toContain('担当者として、日報を短時間で提出したい');
    expect(JSON.stringify(coreItem)).toContain('protectedAreas');
    expect(JSON.stringify(coreItem)).toContain('Next.js');
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

  it('filters projected fields to only the names listed in view.fields', () => {
    const projection = projectSpec(dailyReportSpec());
    const listItem = projection.items.find((item) => item.id === 'view-reportList') as UiViewProjection;

    // reportList.fields = ['date', 'content', 'status', 'submitted'] (4 of 6 entity fields)
    expect(listItem.fields.map((f) => f.name)).toEqual(['date', 'content', 'status', 'submitted']);
  });

  it('reflects enum field options into ProjectedField.options', () => {
    const projection = projectSpec(dailyReportSpec());
    const formItem = projection.items.find((item) => item.id === 'view-reportForm') as UiViewProjection;
    const statusField = formItem.fields.find((f) => f.name === 'status');

    expect(statusField?.options).toEqual(['draft', 'submitted']);
  });

  it('projects uiBlueprint into deterministic view rendering hints', () => {
    const projection = projectSpec(commerceSpec());
    const listItem = projection.items.find((item) => item.id === 'view-productList') as UiViewProjection;

    expect(listItem.template).toBe('commerce-product-grid');
    expect(listItem.density).toBe('high');
    expect(listItem.visualReferences).toEqual(['Amazon-like ecommerce marketplace']);
    expect(listItem.components).toContain('productCard');
    expect(listItem.primaryActionLabel).toBe('カートに入れる');
  });
});
