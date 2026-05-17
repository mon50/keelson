import type { KeelsonSpec } from '../src/types';

export function dailyReportSpec(): KeelsonSpec {
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
    requirements: [
      {
        title: '担当者として、日報を短時間で提出したい',
        view: 'reportForm',
        acceptanceCriteria: ['必須項目と提出状態が同じ画面で確認できる']
      },
      {
        title: 'マネージャーとして、提出状況を一覧で確認したい',
        view: 'reportList',
        acceptanceCriteria: ['提出済みかどうかを一覧上で判断できる']
      }
    ],
    uiBlueprint: {
      designIntent: 'team reporting workspace',
      visualReferences: ['dense SaaS dashboard'],
      density: 'comfortable',
      layout: {
        shell: 'workspace',
        main: 'splitFormPreview'
      },
      components: ['sideNavigation', 'formPanel', 'livePreview', 'requirementCoverage'],
      states: ['default', 'submitted']
    },
    views: {
      reportForm: {
        type: 'form',
        entity: 'report',
        title: '日報入力',
        description: '今日の進捗と課題を短時間で提出するための画面です。',
        primaryAction: '日報を提出',
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

export function commerceSpec(): KeelsonSpec {
  return {
    meta: {
      name: '商品検索アプリ',
      version: '0.1.0',
      lang: 'ja'
    },
    requirements: [
      {
        title: '購入者として、商品を検索して比較したい',
        view: 'productList',
        acceptanceCriteria: ['検索、絞り込み、価格、評価、配送条件を一覧で比較できる']
      }
    ],
    uiBlueprint: {
      designIntent: 'marketplace product discovery',
      visualReferences: ['Amazon-like ecommerce marketplace'],
      doNotCopyBrand: true,
      density: 'high',
      layout: {
        shell: 'commerce',
        header: ['logo', 'search', 'account', 'orders', 'cart'],
        navigation: ['categoryBar', 'filters'],
        main: 'productGrid'
      },
      components: ['searchBar', 'filterSidebar', 'productCard', 'ratingStars', 'priceBlock', 'cartSummary'],
      states: ['default', 'empty', 'loading', 'error', 'addedToCart'],
      sampleDataPolicy: 'realistic',
      tokens: {
        accentColor: '#f59e0b',
        borderRadius: '6px'
      }
    },
    entities: {
      product: {
        fields: {
          productName: { type: 'string', required: true, label: '商品名' },
          brand: { type: 'string', label: 'ブランド' },
          price: { type: 'number', label: '価格' },
          rating: { type: 'number', label: '評価' },
          delivery: { type: 'string', label: '配送' }
        }
      }
    },
    views: {
      productList: {
        type: 'list',
        entity: 'product',
        title: '商品検索',
        fields: ['productName', 'brand', 'price', 'rating', 'delivery']
      }
    },
    flows: {}
  };
}

export function noUiSpec(): KeelsonSpec {
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
