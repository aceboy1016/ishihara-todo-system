import type { Category, Constants, CategoryGoals } from '../types';

// 動的な月次タスクの日付を生成する関数
// 月次繰り返しタスクの基準日として9月を使用（10月に繰り返し表示されるため）
function generateMonthlyTaskDate(day: number): string {
  const year = 2025;
  const month = 9; // 9月を基準月とする
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

export const DEFAULT_CATEGORIES: Record<string, Category> = {
  note: {
    id: 'note',
    name: 'note',
    color: '#41C9B4',
    icon: '📝',
    goal: {
      type: 'number',
      target: 100,
      current: 68,
      unit: 'フォロワー'
    },
    editable: true
  },
  standfm: {
    id: 'standfm',
    name: 'standFM',
    color: '#FF6B35',
    icon: '🎙️',
    goal: {
      type: 'number',
      target: 100,
      current: 9,
      unit: 'フォロワー'
    },
    editable: true
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    color: '#E4405F',
    icon: '📷',
    goal: {
      type: 'number',
      target: 300,
      current: 288,
      unit: 'フォロワー'
    },
    editable: true
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    color: '#FF0000',
    icon: '📺',
    goal: {
      type: 'number',
      target: 200,
      current: 105,
      unit: '登録者'
    },
    editable: true
  },
  expertise: {
    id: 'expertise',
    name: '専門性開発',
    color: '#4ecdc4',
    icon: '🎯',
    goal: {
      type: 'text',
      target: '独自メソッド確立',
      current: '理論構築完了',
      unit: ''
    },
    editable: true
  },
  marketing: {
    id: 'marketing',
    name: 'マーケティング',
    color: '#45b7d1',
    icon: '📈',
    goal: {
      type: 'number',
      target: 3,
      current: 1,
      unit: '月間新規契約'
    },
    editable: true
  },
  business: {
    id: 'business',
    name: 'ビジネス',
    color: '#f9ca24',
    icon: '💼',
    goal: {
      type: 'number',
      target: 500000,
      current: 450000,
      unit: '月収（円）'
    },
    editable: true
  },
  topform: {
    id: 'topform',
    name: 'TOPFORM',
    color: '#e74c3c',
    icon: '🏢',
    goal: {
      type: 'percentage',
      target: 100,
      current: 85,
      unit: '月次業務完了率（%）'
    },
    editable: true
  },
  private: {
    id: 'private',
    name: 'プライベート',
    color: '#9b59b6',
    icon: '🏠',
    goal: {
      type: 'percentage',
      target: 100,
      current: 75,
      unit: '満足度（%）'
    },
    editable: true
  },
  other: {
    id: 'other',
    name: 'その他',
    color: '#7f8c8d',
    icon: '📌',
    goal: {
      type: 'number',
      target: 5,
      current: 3,
      unit: '完了タスク'
    },
    editable: true
  },
  reading: {
    id: 'reading',
    name: '読書',
    color: '#6c5ce7',
    icon: '📚',
    goal: {
      type: 'number',
      target: 5,
      current: 2,
      unit: '冊/月'
    },
    editable: true
  }
};

export const PRIORITY_WEIGHTS = {
  'S': 3,
  'A': 2,
  'B': 1
};

export const ENERGY_MULTIPLIERS = {
  'high': 1.5,
  'medium': 1.0,
  'low': 0.7
};

export const PHASE_THRESHOLDS = [
  25,  // Phase 1 to 2
  50,  // Phase 2 to 3
  75,  // Phase 3 to 4
  90   // Phase 4 to 5
];

export const LOCAL_STORAGE_KEYS = {
  WEEK_DATA: 'ishihara-week-data',
  CATEGORIES: 'ishihara-categories',
  UI_STATE: 'ishihara-ui-state',
  ANALYTICS_CACHE: 'ishihara-analytics-cache',
  WEEKLY_HISTORY: 'ishihara-weekly-history',
  REFLECTION_PROFILE: 'ishihara-reflection-profile',
  LONG_TERM_GOALS: 'ishihara-long-term-goals'
};

export const CONSTANTS: Constants = {
  CATEGORIES: DEFAULT_CATEGORIES,
  PRIORITY_WEIGHTS,
  ENERGY_MULTIPLIERS,
  PHASE_THRESHOLDS,
  LOCAL_STORAGE_KEYS
};

export const INITIAL_GOALS: CategoryGoals = {
  note: {
    target: 100,
    current: 68,
    label: 'note フォロワー',
    unit: '人'
  },
  standfm: {
    target: 100,
    current: 9,
    label: 'standFM フォロワー',
    unit: '人'
  },
  instagram: {
    target: 300,
    current: 288,
    label: 'Instagram フォロワー',
    unit: '人'
  },
  youtube: {
    target: 200,
    current: 105,
    label: 'YouTube 登録者',
    unit: '人'
  },
  expertise: {
    target: '独自メソッド確立',
    current: '理論構築完了',
    label: '専門性開発'
  },
  marketing: {
    target: 3,
    current: 1,
    label: '月間新規契約',
    unit: '件'
  },
  business: {
    target: 500000,
    current: 450000,
    label: '月収',
    unit: '円'
  },
  topform: {
    target: 100,
    current: 85,
    label: 'TOPFORM月次業務',
    unit: '%'
  },
  reading: {
    target: 5,
    current: 2,
    label: '読書',
    unit: '冊/月'
  },
};

// Real tasks
// 動的にタスクを生成する関数
export function generateInitialTasks() {
  return [
  {
    id: 1,
    category: 'note' as const,
    title: 'note ブログ作成',
    priority: 'A' as const,
    energy: 'medium' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 2,
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    category: 'standfm' as const,
    title: 'standFM 撮影',
    priority: 'A' as const,
    energy: 'medium' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 1,
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // 週間繰り返しタスクの例（過去の基準日で設定）
  {
    id: 999,
    category: 'expertise' as const,
    title: '毎週月曜日のトレーニングセッション計画',
    priority: 'A' as const,
    energy: 'high' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 2,
    notes: '毎週月曜日に次週のトレーニングプログラムを準備',
    scheduledDate: '2024-10-28', // 2024年10月28日（月曜日）の基準日 - 過去の日付
    isRecurring: true,
    recurringType: 'weekly' as const,
    recurringInterval: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 1000,
    category: 'marketing' as const,
    title: '毎週金曜日のSNS投稿計画',
    priority: 'A' as const,
    energy: 'medium' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 1.5,
    notes: '毎週金曜日に次週のSNS投稿内容を計画',
    scheduledDate: '2024-11-01', // 2024年11月1日（金曜日）の基準日 - 過去の日付
    isRecurring: true,
    recurringType: 'weekly' as const,
    recurringInterval: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 1001,
    category: 'note' as const,
    title: '毎週水曜日のnote記事執筆',
    priority: 'A' as const,
    energy: 'high' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 3,
    notes: '毎週水曜日にnote記事を執筆',
    scheduledDate: '2024-10-30', // 2024年10月30日（水曜日）の基準日 - 過去の日付
    isRecurring: true,
    recurringType: 'weekly' as const,
    recurringInterval: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // 毎月1日の業務
  {
    id: 3,
    category: 'topform' as const,
    title: '【毎月1日】【半蔵門】体全中会長の継続月数調整',
    priority: 'A' as const,
    energy: 'medium' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 1,
    notes: 'TOPFORM業務',
    scheduledDate: generateMonthlyTaskDate(1),
    isRecurring: true,
    recurringType: 'monthly' as const,
    recurringInterval: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 4,
    category: 'topform' as const,
    title: '【毎月1日】【2店舗】月末決済失敗分の対応とsquare確認',
    priority: 'A' as const,
    energy: 'medium' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 2,
    notes: 'TOPFORM業務',
    scheduledDate: generateMonthlyTaskDate(1),
    isRecurring: true,
    recurringType: 'monthly' as const,
    recurringInterval: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 5,
    category: 'topform' as const,
    title: '【毎月1日】【2店舗】決済失敗確認',
    priority: 'A' as const,
    energy: 'low' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 1,
    notes: 'TOPFORM業務',
    scheduledDate: generateMonthlyTaskDate(1),
    isRecurring: true,
    recurringType: 'monthly' as const,
    recurringInterval: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 6,
    category: 'topform' as const,
    title: '【毎月1日】笹間さんへ一山中さん入会確認',
    priority: 'B' as const,
    energy: 'low' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 0.5,
    notes: 'TOPFORM業務',
    scheduledDate: generateMonthlyTaskDate(1),
    isRecurring: true,
    recurringType: 'monthly' as const,
    recurringInterval: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 7,
    category: 'topform' as const,
    title: '【毎月1日】翌月HALLEL固定枠確保',
    priority: 'B' as const,
    energy: 'medium' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 1,
    notes: 'TOPFORM業務',
    scheduledDate: generateMonthlyTaskDate(1),
    isRecurring: true,
    recurringType: 'monthly' as const,
    recurringInterval: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // 毎月3日の業務
  {
    id: 8,
    category: 'topform' as const,
    title: '【毎月3日】個人の楽々精算/勤怠提出',
    priority: 'S' as const,
    energy: 'low' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 1,
    notes: 'TOPFORM業務',
    scheduledDate: generateMonthlyTaskDate(3),
    isRecurring: true,
    recurringType: 'monthly' as const,
    recurringInterval: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 9,
    category: 'topform' as const,
    title: '【毎月3日】勤怠',
    priority: 'S' as const,
    energy: 'low' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 0.5,
    notes: 'TOPFORM業務',
    scheduledDate: generateMonthlyTaskDate(3),
    isRecurring: true,
    recurringType: 'monthly' as const,
    recurringInterval: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // 毎月5日の業務
  {
    id: 10,
    category: 'topform' as const,
    title: '【毎月5日】【半蔵門】B日程（10日払い）決済設定→スプレ作成→星野さんへ',
    priority: 'A' as const,
    energy: 'medium' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 2,
    notes: 'TOPFORM業務',
    scheduledDate: generateMonthlyTaskDate(5),
    isRecurring: true,
    recurringType: 'monthly' as const,
    recurringInterval: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 11,
    category: 'topform' as const,
    title: '【毎月5日】【2店舗】前月分のsquareデータと取引状況/Amazon購入履歴を笹間さんへ共有',
    priority: 'A' as const,
    energy: 'medium' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 1.5,
    notes: 'TOPFORM業務',
    scheduledDate: generateMonthlyTaskDate(5),
    isRecurring: true,
    recurringType: 'monthly' as const,
    recurringInterval: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 12,
    category: 'topform' as const,
    title: '【毎月5日】月例資料の作成開始',
    priority: 'A' as const,
    energy: 'high' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 3,
    notes: 'TOPFORM業務',
    scheduledDate: generateMonthlyTaskDate(5),
    isRecurring: true,
    recurringType: 'monthly' as const,
    recurringInterval: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 13,
    category: 'topform' as const,
    title: '【毎月5日】収支表アップデート（前月実績の売上合計入力・決済手数料の入力・コスト入力）',
    priority: 'A' as const,
    energy: 'medium' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 2,
    notes: 'TOPFORM業務',
    scheduledDate: generateMonthlyTaskDate(5),
    isRecurring: true,
    recurringType: 'monthly' as const,
    recurringInterval: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 14,
    category: 'topform' as const,
    title: '【毎月5日】小早&レジートを笹間さんへ郵送（なければ省略）',
    priority: 'B' as const,
    energy: 'low' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 0.5,
    notes: 'TOPFORM業務',
    scheduledDate: generateMonthlyTaskDate(5),
    isRecurring: true,
    recurringType: 'monthly' as const,
    recurringInterval: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // 毎月10日の業務
  {
    id: 15,
    category: 'topform' as const,
    title: '【毎月10日】扇田様・崎前様 領収書作成→笹間さん→LINEで送信',
    priority: 'A' as const,
    energy: 'medium' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 1,
    notes: 'TOPFORM業務',
    scheduledDate: generateMonthlyTaskDate(10),
    isRecurring: true,
    recurringType: 'monthly' as const,
    recurringInterval: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 16,
    category: 'topform' as const,
    title: '【毎月10日】西川さん 請求書を作成後宮崎さんへ送る',
    priority: 'A' as const,
    energy: 'medium' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 1,
    notes: 'TOPFORM業務',
    scheduledDate: generateMonthlyTaskDate(10),
    isRecurring: true,
    recurringType: 'monthly' as const,
    recurringInterval: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 17,
    category: 'topform' as const,
    title: '【毎月10日】当月の月例資料の完成',
    priority: 'S' as const,
    energy: 'high' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 2,
    notes: 'TOPFORM業務',
    scheduledDate: generateMonthlyTaskDate(10),
    isRecurring: true,
    recurringType: 'monthly' as const,
    recurringInterval: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // 毎月11日の業務
  {
    id: 18,
    category: 'topform' as const,
    title: '【毎月11日】【半蔵門】B日程の決済失敗確認',
    priority: 'A' as const,
    energy: 'low' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 1,
    notes: 'TOPFORM業務',
    scheduledDate: generateMonthlyTaskDate(11),
    isRecurring: true,
    recurringType: 'monthly' as const,
    recurringInterval: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // 毎月20日の業務
  {
    id: 19,
    category: 'topform' as const,
    title: '【毎月20日】【2店舗】営業管理ボードの更新依頼',
    priority: 'B' as const,
    energy: 'low' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 0.5,
    notes: 'TOPFORM業務',
    scheduledDate: generateMonthlyTaskDate(20),
    isRecurring: true,
    recurringType: 'monthly' as const,
    recurringInterval: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // 毎月26日の業務
  {
    id: 20,
    category: 'topform' as const,
    title: '【毎月26日】恵比寿/半蔵門 営業管理ボード更新',
    priority: 'A' as const,
    energy: 'medium' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 2,
    notes: 'TOPFORM業務',
    scheduledDate: generateMonthlyTaskDate(26),
    isRecurring: true,
    recurringType: 'monthly' as const,
    recurringInterval: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 21,
    category: 'topform' as const,
    title: '【毎月26日】請求書の完成→スプレッドシート出力',
    priority: 'A' as const,
    energy: 'medium' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 1.5,
    notes: 'TOPFORM業務',
    scheduledDate: generateMonthlyTaskDate(26),
    isRecurring: true,
    recurringType: 'monthly' as const,
    recurringInterval: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 22,
    category: 'topform' as const,
    title: '予約早見表のリッチメニューサムネ作り',
    priority: 'A' as const,
    energy: 'medium' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 2,
    notes: 'TOPFORM業務',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // ビジネス基盤確立（9月）
  {
    id: 23,
    category: 'business' as const,
    title: '【9月】税理士面談（3社比較）',
    priority: 'S' as const,
    energy: 'high' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 4,
    notes: '基盤確立',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 24,
    category: 'business' as const,
    title: '【9月】青色申告承認申請',
    priority: 'S' as const,
    energy: 'medium' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 2,
    notes: '基盤確立',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 25,
    category: 'business' as const,
    title: '【9月】事業用口座開設（住信SBI）',
    priority: 'A' as const,
    energy: 'medium' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 2,
    notes: '基盤確立',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 26,
    category: 'business' as const,
    title: '【9月】PL保険・業務災害保険加入',
    priority: 'A' as const,
    energy: 'medium' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 3,
    notes: '基盤確立',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // 顧客対応・ブランド構築（9月）
  {
    id: 27,
    category: 'business' as const,
    title: '【9月】28名全顧客への移行説明',
    priority: 'S' as const,
    energy: 'high' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 12,
    notes: '顧客対応・ブランド構築',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 28,
    category: 'business' as const,
    title: '【9月】新料金体系の合意取得',
    priority: 'S' as const,
    energy: 'high' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 8,
    notes: '顧客対応・ブランド構築',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 29,
    category: 'business' as const,
    title: '【9月】HP完成（富裕層向け）',
    priority: 'A' as const,
    energy: 'high' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 20,
    notes: '顧客対応・ブランド構築',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 30,
    category: 'business' as const,
    title: '【9月】名刺完成',
    priority: 'B' as const,
    energy: 'low' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 2,
    notes: '顧客対応・ブランド構築',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 31,
    category: 'business' as const,
    title: '【9月】紹介プログラム案内',
    priority: 'A' as const,
    energy: 'medium' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 4,
    notes: '顧客対応・ブランド構築',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // システム・最終準備（10月）
  {
    id: 32,
    category: 'business' as const,
    title: '【10月】会計ソフト（freee）導入',
    priority: 'S' as const,
    energy: 'medium' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 6,
    notes: 'システム・最終準備',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 33,
    category: 'business' as const,
    title: '【10月】エクササイズライブラリー商用化',
    priority: 'A' as const,
    energy: 'high' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 15,
    notes: 'システム・最終準備',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 34,
    category: 'business' as const,
    title: '【10月】顧客管理システム構築',
    priority: 'A' as const,
    energy: 'high' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 10,
    notes: 'システム・最終準備',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // 業務効率化タスク
  {
    id: 35,
    category: 'topform' as const,
    title: '月例資料の効率化',
    priority: 'A' as const,
    energy: 'medium' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 3,
    notes: '業務の効率化',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 36,
    category: 'topform' as const,
    title: '月末処理の効率化',
    priority: 'A' as const,
    energy: 'medium' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 2.5,
    notes: '業務の効率化',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 37,
    category: 'topform' as const,
    title: '入会手続きのオンライン化',
    priority: 'S' as const,
    energy: 'high' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 8,
    notes: '業務の効率化',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 38,
    category: 'topform' as const,
    title: '恵比寿店の現金撤廃',
    priority: 'A' as const,
    energy: 'medium' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 4,
    notes: '業務の効率化',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 39,
    category: 'topform' as const,
    title: '予約候補送信システム',
    priority: 'A' as const,
    energy: 'high' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 6,
    notes: '業務の効率化',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // HALLELタスク
  {
    id: 40,
    category: 'topform' as const,
    title: '【HALLEL】半蔵門店の早見表作成',
    priority: 'B' as const,
    energy: 'medium' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 2,
    notes: 'HALLEL',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // プライベートタスク
  {
    id: 41,
    category: 'private' as const,
    title: '結婚指輪',
    priority: 'S' as const,
    energy: 'medium' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 4,
    notes: 'プライベート',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 42,
    category: 'private' as const,
    title: '結婚式',
    priority: 'S' as const,
    energy: 'high' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 20,
    notes: 'プライベート',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 43,
    category: 'private' as const,
    title: '両家挨拶',
    priority: 'S' as const,
    energy: 'high' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 8,
    notes: 'プライベート',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 44,
    category: 'private' as const,
    title: '引越し',
    priority: 'A' as const,
    energy: 'high' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 12,
    notes: 'プライベート',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // 読書タスク
  {
    id: 45,
    category: 'reading' as const,
    title: '7つの習慣',
    priority: 'B' as const,
    energy: 'medium' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 10,
    readingStatus: 'reading' as const,
    notes: '自己啓発書',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 46,
    category: 'reading' as const,
    title: '人を動かす',
    priority: 'A' as const,
    energy: 'medium' as const,
    completed: true,
    completedDate: new Date().toISOString(),
    estimatedHours: 8,
    readingStatus: 'completed' as const,
    notes: 'コミュニケーション',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 47,
    category: 'reading' as const,
    title: 'Think and Grow Rich',
    priority: 'B' as const,
    energy: 'low' as const,
    completed: false,
    completedDate: null,
    estimatedHours: 12,
    readingStatus: 'reading' as const,
    notes: '成功哲学',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  ];
}

// 後方互換性のための定数
export const INITIAL_TASKS = generateInitialTasks();

export const COLOR_PALETTE = {
  primary: {
    cyan: '#00b8ff',
    green: '#00ff88',
    gradient: 'linear-gradient(135deg, #00b8ff 0%, #00ff88 100%)'
  },
  background: {
    primary: 'from-gray-900 via-blue-900 to-gray-900',
    card: 'rgba(26, 26, 46, 0.8)',
    hover: 'rgba(26, 26, 46, 0.95)'
  },
  category: {
    note: '#41C9B4',
    standfm: '#FF6B35',
    instagram: '#E4405F',
    youtube: '#FF0000',
    expertise: '#4ecdc4',
    marketing: '#45b7d1',
    business: '#f9ca24',
    topform: '#e74c3c',
    private: '#9b59b6',
    other: '#7f8c8d',
    reading: '#6c5ce7'
  },
  priority: {
    S: '#ff4757',
    A: '#ffa502',
    B: '#2ed573'
  },
  energy: {
    high: '#00ff88',
    medium: '#ffa502',
    low: '#ff4757'
  }
};