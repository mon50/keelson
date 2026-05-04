import type { ReforgeSpec } from '../src/types';

export function dailyReportSpec(): ReforgeSpec {
  return {
    meta: {
      name: '日報アプリ',
      version: '0.1.0',
      lang: 'ja'
    },
    entities: {
      report: {
        fields: {
          date: { type: 'date', required: true, label: '日付' },
          content: { type: 'text', required: true, label: '内容' },
          hours: { type: 'number', label: '作業時間' },
          status: {
            type: 'enum',
            options: ['draft', 'submitted'],
            label: 'ステータス'
          },
          submitted: { type: 'boolean', label: '提出済み' },
          owner: { type: 'string', label: '担当者' }
        }
      }
    },
    views: {
      reportForm: {
        type: 'form',
        entity: 'report',
        title: '日報入力',
        fields: ['date', 'content', 'hours', 'status', 'submitted', 'owner']
      },
      reportList: {
        type: 'list',
        entity: 'report',
        title: '日報一覧',
        fields: ['date', 'content', 'status', 'submitted']
      },
      reportDetail: {
        type: 'detail',
        entity: 'report',
        title: '日報詳細'
      }
    },
    database: {
      save: '提出された日報を保存する',
      get: '日報一覧と詳細で取得する'
    },
    backend: {
      success: '保存成功時に完了を返す',
      failure: '保存失敗時に理由を返す'
    },
    logic: {
      validation: '作業時間は0以上',
      transition: 'draftからsubmittedへ遷移'
    },
    analytics: {
      export: '集計用に日報件数を保持する'
    }
  };
}

export function noUiSpec(): ReforgeSpec {
  return {
    meta: { name: '非画面仕様だけのアプリ', version: '0.1.0', lang: 'ja' },
    entities: {},
    views: {},
    flows: {
      submit: {
        steps: ['入力内容を検証する']
      }
    }
  };
}
