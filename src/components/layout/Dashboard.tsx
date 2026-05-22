import React, { useMemo, useState, useEffect } from 'react';
import { Settings2 } from 'lucide-react';
import { Header } from './Header';
import { type TimePeriodFilter } from './TimePeriodSidebar';
import { ProgressCard } from '../analytics/ProgressCard';
import { AnalyticsCard } from '../analytics/AnalyticsCard';
import { TaskCategory } from '../tasks/TaskCategory';
import { RecurringTasksPanel } from '../tasks/RecurringTasksPanel';
import { TaskModal } from '../ui/TaskModal';
import { TaskRolloverModal } from '../ui/TaskRolloverModal';
import { TaskSelectModal } from '../ui/TaskSelectModal';
import { CategoryManagerModal } from '../ui/CategoryManagerModal';
import { ReflectionForm } from '../reflection/ReflectionForm';
import { AIInsightPanel } from '../reflection/AIInsightPanel';
import { LongTermGoalsPanel } from '../goals/LongTermGoalsPanel';
import { SNSGoalsEditor } from '../goals/SNSGoalsEditor';
import { WeeklyTimeline } from '../schedule/WeeklyTimeline';
import { WeeklyCalendar } from '../schedule/WeeklyCalendar';
import type {
  AIInsight,
  CategoryGoals,
  Task,
  TaskFormData,
  WeekData,
  WeekHistoryEntry,
  WeeklyReflectionInput,
} from '../../types';
import { getWeekDateRange, getCurrentWeekNumber, getWeekDates } from '../../utils/dateUtils';
import { INITIAL_GOALS, generateInitialTasks } from '../../constants/categories';
import { exportToJSON, downloadJSON } from '../../utils/exportUtils';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useCustomCategories } from '../../hooks/useCustomCategories';
import {
  getIncompleteTasksForDate,
  rolloverIncompleteTasks,
  getYesterday,
  getToday,
  formatDateToString
} from '../../utils/taskRollover';
import { useWeeklyHistory, useReflectionProfile, createHistoryEntry } from '../../hooks/useWeeklyHistory';
import { useAIInsights } from '../../hooks/useAIInsights';

const DEFAULT_CATEGORY_LIST = [
  { id: 'note', name: 'note', icon: '📝', color: '#41C9B4' },
  { id: 'standfm', name: 'standFM', icon: '🎙️', color: '#FF6B35' },
  { id: 'instagram', name: 'Instagram', icon: '📷', color: '#E4405F' },
  { id: 'youtube', name: 'YouTube', icon: '📺', color: '#FF0000' },
  { id: 'expertise', name: '専門性開発', icon: '🎯', color: '#4ecdc4' },
  { id: 'marketing', name: 'マーケティング', icon: '📈', color: '#45b7d1' },
  { id: 'business', name: 'ビジネス', icon: '💼', color: '#f9ca24' },
  { id: 'topform', name: 'TOPFORM', icon: '🏢', color: '#e74c3c' },
  { id: 'private', name: 'プライベート', icon: '🏠', color: '#9b59b6' },
  { id: 'other', name: 'その他', icon: '📌', color: '#7f8c8d' },
  { id: 'reading', name: '読書', icon: '📚', color: '#6c5ce7' },
] as const;

interface DashboardProps {
  // This will be populated with hooks later
}

export const Dashboard: React.FC<DashboardProps> = () => {
  // Temporary state - will be replaced with custom hooks
  const [currentWeek, setCurrentWeek] = useState(getCurrentWeekNumber());
  const [dateRange, setDateRange] = useState(getWeekDateRange(getCurrentWeekNumber()));
  const [phase] = useState(1);
  const [currentView, setCurrentView] = useState<'dashboard' | 'analytics' | 'history'>('dashboard');
  const [goals] = useLocalStorage<CategoryGoals>('strategic-todo-goals', INITIAL_GOALS);
  const [tasks, setTasks] = useState<Task[]>([]);

  // 期間フィルターとカテゴリー管理
  const [timePeriodFilter, setTimePeriodFilter] = useState<TimePeriodFilter>('all');
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const { customCategories, addCategory, updateCategory, deleteCategory } = useCustomCategories();
  const allCategories = useMemo(
    () => [...DEFAULT_CATEGORY_LIST, ...customCategories],
    [customCategories]
  );

  // 繰り越しモーダル関連のステート
  const [showRolloverModal, setShowRolloverModal] = useState(false);
  const [incompleteTasks, setIncompleteTasks] = useState<Task[]>([]);
  const [rolloverFromDate, setRolloverFromDate] = useState<Date>(getYesterday());
  const [rolloverToDate, setRolloverToDate] = useState<Date>(getToday());

  // タスク選択モーダル関連のステート
  const [showTaskSelectModal, setShowTaskSelectModal] = useState(false);
  const [selectedDateForTask, setSelectedDateForTask] = useState<Date>(new Date());
  const [defaultTaskData, setDefaultTaskData] = useState<Partial<TaskFormData> | undefined>(undefined);

  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [defaultCategory, setDefaultCategory] = useState<string | undefined>(undefined);
  const { entries, upsertEntry, getEntry } = useWeeklyHistory();
  const { profile } = useReflectionProfile();
  const { generateInsight, isGenerating, error: aiError } = useAIInsights();

  const defaultReflection: WeeklyReflectionInput = useMemo(
    () => ({
      wins: '',
      challenges: '',
      learnings: '',
      mood: 'neutral',
      energy: 'balanced',
      focusNextWeek: '',
      notes: '',
    }),
    []
  );

  const existingEntry = useMemo<WeekHistoryEntry | undefined>(
    () => getEntry(currentWeek, new Date().getFullYear()),
    [getEntry, currentWeek]
  );

  const [reflection, setReflection] = useState<WeeklyReflectionInput>(existingEntry?.reflection ?? defaultReflection);
  const [currentInsight, setCurrentInsight] = useState<AIInsight | undefined>(existingEntry?.aiInsight);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | undefined>(existingEntry?.createdAt);

  // Sample week data for demonstration
  const weekData: WeekData = {
    weekNumber: currentWeek,
    dateRange,
    phase,
    phaseProgress: {
      overall: 45,
      methodology: 60,
      onlinePlatform: 30,
      revenue: 40
    },
    tasks,
    goals,
    insights: [
      '高エネルギータスクの完了率が向上しています',
      'SNSカテゴリで一定の進展が見られます',
      'システム化タスクを増やすことを推奨します'
    ],
    weeklyReflection: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const handleExport = () => {
    try {
      const exportData = exportToJSON([weekData]);
      downloadJSON(exportData);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const jsonData = JSON.parse(e.target?.result as string);
            if (jsonData.weekData?.[0]?.tasks) {
              setTasks(jsonData.weekData[0].tasks);
            } else {
              console.error('Invalid JSON format');
              alert('無効なJSONファイル形式です');
            }
          } catch (error) {
            console.error('JSON parse error:', error);
            alert('JSONファイルの読み込みに失敗しました');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleTaskToggle = (taskId: number) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              completed: !task.completed,
              completedDate: !task.completed ? new Date().toISOString() : null,
              readingStatus: task.category === 'reading'
                ? (!task.completed ? 'completed' : 'reading')
                : task.readingStatus,
              updatedAt: new Date().toISOString()
            }
          : task
      )
    );
  };

  const handleTaskUpdate = (taskId: number, updates: Partial<Task>) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? { ...task, ...updates, updatedAt: new Date().toISOString() }
          : task
      )
    );
  };

  const handleTaskDateUpdate = (taskId: number, newDate: Date) => {
    // タイムゾーンの問題を解決するため、ローカル日付を使用
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, '0');
    const day = String(newDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              scheduledDate: dateString,
              updatedAt: new Date().toISOString()
            }
          : task
      )
    );
  };

  const handleAddTask = (taskData: TaskFormData) => {
    const newTask: Task = {
      id: Math.max(...tasks.map(t => t.id)) + 1,
      ...taskData,
      completed: false,
      completedDate: null,
      actualHours: 0,
      readingStatus: taskData.category === 'reading' ? 'reading' : undefined,
      scheduledDate: taskData.scheduledDate || undefined,
      isRecurring: taskData.isRecurring || false,
      recurringType: taskData.recurringType || undefined,
      recurringInterval: taskData.recurringInterval || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setTasks(prevTasks => [...prevTasks, newTask]);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleUpdateTask = (taskData: TaskFormData) => {
    if (editingTask) {
      const updatedTask: Task = {
        ...editingTask,
        ...taskData,
        readingStatus: taskData.category === 'reading'
          ? (editingTask.readingStatus || 'reading')
          : undefined,
        scheduledDate: taskData.scheduledDate || undefined,
        isRecurring: taskData.isRecurring || false,
        recurringType: taskData.recurringType || undefined,
        recurringInterval: taskData.recurringInterval || undefined,
        updatedAt: new Date().toISOString()
      };
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === editingTask.id ? updatedTask : task
        )
      );
      setEditingTask(undefined);
    } else {
      handleAddTask(taskData);
    }
  };

  const handleDeleteTask = (taskId: number) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };

  const handleCloseModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(undefined);
    setDefaultCategory(undefined);
    setDefaultTaskData(undefined);
  };

  const handleTaskMove = (taskId: number, newCategory: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? { ...task, category: newCategory as Task['category'], updatedAt: new Date().toISOString() }
          : task
      )
    );
  };

  // Load tasks for current week on mount and week change
  React.useEffect(() => {
    const weekKey = `strategic-todo-tasks-week${currentWeek}`;
    const recurringTasksKey = 'strategic-todo-recurring-tasks';

    let savedTasks = localStorage.getItem(weekKey);
    let recurringTasks = localStorage.getItem(recurringTasksKey);

    // Migration: If week 39 data doesn't exist but v2 data exists, migrate it
    if (!savedTasks && currentWeek === 39) {
      const v2Tasks = localStorage.getItem('strategic-todo-tasks-v2');
      if (v2Tasks) {
        localStorage.setItem(weekKey, v2Tasks);
        savedTasks = v2Tasks;
      }
    }

    let weekTasks: Task[] = [];
    let globalRecurringTasks: Task[] = [];

    // 週固有のタスクを読み込み
    if (savedTasks) {
      try {
        weekTasks = JSON.parse(savedTasks);
      } catch (error) {
        console.error('Failed to load tasks for week', currentWeek, error);
        weekTasks = generateInitialTasks();
      }
    } else {
      weekTasks = generateInitialTasks();
    }

    // 強制初期化フラグをチェック
    if (sessionStorage.getItem('force-reload-initial-tasks')) {
      sessionStorage.removeItem('force-reload-initial-tasks');
      weekTasks = generateInitialTasks();
    }

    // グローバルな繰り返しタスクを読み込み
    if (recurringTasks) {
      try {
        globalRecurringTasks = JSON.parse(recurringTasks);
      } catch (error) {
        console.error('Failed to load recurring tasks', error);
        globalRecurringTasks = [];
      }
    }

    // 週固有でない繰り返しタスクを週固有タスクから分離してグローバルに移行
    const nonRecurringTasks = weekTasks.filter(task => !task.isRecurring);
    const recurringFromWeek = weekTasks.filter(task => task.isRecurring);

    // 重複を防いでグローバル繰り返しタスクに追加
    const mergedRecurringTasks = [...globalRecurringTasks];
    recurringFromWeek.forEach(newTask => {
      if (!mergedRecurringTasks.some(existing => existing.id === newTask.id)) {
        mergedRecurringTasks.push(newTask);
      }
    });

    // グローバル繰り返しタスクを保存
    if (mergedRecurringTasks.length > 0) {
      localStorage.setItem(recurringTasksKey, JSON.stringify(mergedRecurringTasks));
    }

    // 週固有タスクのみを保存（繰り返しタスクを除外）
    if (recurringFromWeek.length > 0) {
      localStorage.setItem(weekKey, JSON.stringify(nonRecurringTasks));
    }

    // 最終的なタスクリストを作成（週固有 + グローバル繰り返し）
    const finalTasks = [...nonRecurringTasks, ...mergedRecurringTasks];
    setTasks(finalTasks);
  }, [currentWeek]);

  // Save tasks to localStorage whenever tasks change
  React.useEffect(() => {
    const weekKey = `strategic-todo-tasks-week${currentWeek}`;
    const recurringTasksKey = 'strategic-todo-recurring-tasks';

    // タスクを週固有とグローバル繰り返しに分離
    const nonRecurringTasks = tasks.filter(task => !task.isRecurring);
    const recurringTasks = tasks.filter(task => task.isRecurring);

    // 週固有タスクを保存
    localStorage.setItem(weekKey, JSON.stringify(nonRecurringTasks));

    // グローバル繰り返しタスクを保存
    if (recurringTasks.length > 0) {
      localStorage.setItem(recurringTasksKey, JSON.stringify(recurringTasks));
    }
  }, [tasks, currentWeek]);

  // 繰り越しチェック用のuseEffect
  useEffect(() => {
    // 初回ロード時のみ、昨日の未完了タスクをチェック
    const checkForRollover = () => {
      const yesterday = getYesterday();
      const today = getToday();
      const lastRolloverCheck = localStorage.getItem('last-rollover-check');
      const todayString = formatDateToString(today);

      // 今日既にチェック済みの場合はスキップ
      if (lastRolloverCheck === todayString) {
        return;
      }

      const incompleteYesterday = getIncompleteTasksForDate(tasks, yesterday);

      if (incompleteYesterday.length > 0) {
        setIncompleteTasks(incompleteYesterday);
        setRolloverFromDate(yesterday);
        setRolloverToDate(today);
        setShowRolloverModal(true);
      }

      // チェック済みマークを保存
      localStorage.setItem('last-rollover-check', todayString);
    };

    if (tasks.length > 0) {
      checkForRollover();
    }
  }, [tasks]);

  // 繰り越し処理の実行
  const handleConfirmRollover = () => {
    const { updatedTasks } = rolloverIncompleteTasks(tasks, rolloverFromDate, rolloverToDate);
    setTasks(updatedTasks);
    setShowRolloverModal(false);
    setIncompleteTasks([]);
  };

  // 繰り越しをスキップ
  const handleSkipRollover = () => {
    setShowRolloverModal(false);
    setIncompleteTasks([]);
  };

  // 日付にタスクを追加（新規タスクを作成）
  const handleAddTaskToDate = (date: Date) => {
    const dateString = formatDateToString(date);
    setDefaultTaskData({ scheduledDate: dateString });
    setIsTaskModalOpen(true);
  };

  // 既存タスクを選択して日付に追加
  const handleSelectExistingTask = (date: Date) => {
    setSelectedDateForTask(date);
    setShowTaskSelectModal(true);
  };

  // 選択されたタスクに日付を設定
  const handleTaskSelect = (task: Task, selectedDate: Date) => {
    // タイムゾーンの問題を解決するため、ローカル日付を使用
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    setTasks(prevTasks =>
      prevTasks.map(t =>
        t.id === task.id
          ? {
              ...t,
              scheduledDate: dateString,
              updatedAt: new Date().toISOString()
            }
          : t
      )
    );

    setShowTaskSelectModal(false);
  };

  const handleWeekChange = (weekNumber: number) => {
    setCurrentWeek(weekNumber);
    setDateRange(getWeekDateRange(weekNumber));
  };

  // 全カテゴリーのフィルタリングを1回のuseMemoで処理（毎render11回呼ぶのをやめる）
  const { filteredTasksByCategory, taskCountsByPeriod } = useMemo(() => {
    const todayStr = formatDateToString(new Date());
    const { start: weekStart, end: weekEnd } = getWeekDates(currentWeek);
    const now = new Date();

    const matchesPeriod = (t: Task): boolean => {
      if (timePeriodFilter === 'all') return true;
      if (!t.scheduledDate) return false;
      if (timePeriodFilter === 'today') return t.scheduledDate === todayStr;
      const d = new Date(t.scheduledDate + 'T00:00:00');
      if (timePeriodFilter === 'week') return d >= weekStart && d <= weekEnd;
      if (timePeriodFilter === 'month') return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      return true;
    };

    const map: Record<string, Task[]> = {};
    for (const t of tasks) {
      if (!map[t.category]) map[t.category] = [];
      if (matchesPeriod(t)) map[t.category].push(t);
    }

    const nonRecurring = tasks.filter(t => !t.isRecurring);
    return {
      filteredTasksByCategory: map,
      taskCountsByPeriod: {
        all: nonRecurring.length,
        today: nonRecurring.filter(t => t.scheduledDate === todayStr).length,
        week: nonRecurring.filter(t => {
          if (!t.scheduledDate) return false;
          const d = new Date(t.scheduledDate + 'T00:00:00');
          return d >= weekStart && d <= weekEnd;
        }).length,
        month: nonRecurring.filter(t => {
          if (!t.scheduledDate) return false;
          const d = new Date(t.scheduledDate + 'T00:00:00');
          return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        }).length,
      },
    };
  }, [tasks, currentWeek, timePeriodFilter]);

  const getFilteredTasksByCategory = (category: string) => filteredTasksByCategory[category] ?? [];

  const calculateCompletionRate = () => {
    if (tasks.length === 0) return 0;
    return Math.round((tasks.filter(task => task.completed).length / tasks.length) * 100);
  };

  const calculateCategoryProgress = (category: string) => {
    const all = tasks.filter(t => t.category === category);
    if (all.length === 0) return 0;
    return Math.round((all.filter(t => t.completed).length / all.length) * 100);
  };

  const handleReflectionChange = (updates: Partial<WeeklyReflectionInput>) => {
    setReflection((prev) => ({ ...prev, ...updates }));
    setSaveStatus('idle');
  };

  const handleSaveReflection = async () => {
    try {
      setSaveStatus('saving');
      setSaveError(null);

      const entry = createHistoryEntry({
        weekNumber: currentWeek,
        year: new Date().getFullYear(),
        dateRange,
        tasks,
        reflection,
        insight: currentInsight,
        existingEntry,
      });

      upsertEntry(entry);
      setLastSavedAt(entry.createdAt);
      setSaveStatus('saved');
    } catch (error) {
      console.error('[Reflection] Failed to save history', error);
      setSaveStatus('error');
      setSaveError('振り返りの保存に失敗しました。再度お試しください。');
    }
  };

  const handleGenerateInsight = async () => {
    try {
      const metricsEntry = createHistoryEntry({
        weekNumber: currentWeek,
        year: new Date().getFullYear(),
        dateRange,
        tasks,
        reflection,
        existingEntry,
      });

      const insight = await generateInsight({
        profile,
        metrics: metricsEntry.metrics,
        reflection,
        tasks,
      });

      setCurrentInsight(insight);
      const entryWithInsight = {
        ...metricsEntry,
        aiInsight: insight,
      };
      upsertEntry(entryWithInsight);
      setLastSavedAt(entryWithInsight.createdAt);
      setSaveStatus('saved');
    } catch (error) {
      console.error('[AI] Insight generation failed', error);
      setSaveStatus('error');
      setSaveError(aiError || 'AI提案の生成に失敗しました。');
    }
  };

  return (
    <div className="min-h-screen relative z-10">
      <Header
        currentWeek={currentWeek}
        dateRange={dateRange}
        phase={phase}
        onViewChange={setCurrentView}
        currentView={currentView}
        onExport={handleExport}
        onImport={handleImport}
        onWeekChange={handleWeekChange}
      />

      {/* Sticky filter bar — visible at all times in dashboard view */}
      {currentView === 'dashboard' && (
        <div className="sticky top-16 z-40 bg-[#0e0e0e] border-b border-[#1f1f1f]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-3 flex-wrap">
            <span className="text-xs font-semibold text-[#666] uppercase tracking-wide shrink-0">期間</span>
            {([
              { key: 'all' as const, label: '全て', count: taskCountsByPeriod.all },
              { key: 'today' as const, label: '今日', count: taskCountsByPeriod.today },
              { key: 'week' as const, label: '今週', count: taskCountsByPeriod.week },
              { key: 'month' as const, label: '今月', count: taskCountsByPeriod.month },
            ]).map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setTimePeriodFilter(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  timePeriodFilter === key
                    ? 'bg-[#00b8ff] text-[#0a0a0a]'
                    : 'bg-[#1a1a1a] text-[#999] border border-[#2a2a2a] hover:bg-[#222] hover:text-white'
                }`}
              >
                {label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  timePeriodFilter === key ? 'bg-[#0a0a0a]/20 text-[#0a0a0a]' : 'bg-[#252525] text-[#666]'
                }`}>
                  {count}
                </span>
              </button>
            ))}
            <div className="ml-auto">
              <button
                onClick={() => setShowCategoryManager(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] rounded-full text-sm text-[#999] hover:text-white transition-colors"
              >
                <Settings2 className="h-3.5 w-3.5" />
                カテゴリー管理
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {currentView === 'dashboard' && (
          <div className="space-y-8">
            {/* Progress Overview */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white">進捗概要</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ProgressCard
                  title="全体進捗"
                  current={calculateCompletionRate()}
                  target={100}
                  unit="%"
                  trend={5}
                  color="cyan"
                />
                <ProgressCard
                  title="note"
                  current={typeof goals.note.current === 'number' ? goals.note.current : 0}
                  target={typeof goals.note.target === 'number' ? goals.note.target : 0}
                  unit={goals.note.unit}
                  trend={8}
                  color="teal"
                />
                <ProgressCard
                  title="standFM"
                  current={typeof goals.standfm.current === 'number' ? goals.standfm.current : 0}
                  target={typeof goals.standfm.target === 'number' ? goals.standfm.target : 0}
                  unit={goals.standfm.unit}
                  trend={12}
                  color="orange"
                />
                <ProgressCard
                  title="Instagram"
                  current={typeof goals.instagram.current === 'number' ? goals.instagram.current : 0}
                  target={typeof goals.instagram.target === 'number' ? goals.instagram.target : 0}
                  unit={goals.instagram.unit}
                  trend={5}
                  color="pink"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                <ProgressCard
                  title="YouTube"
                  current={typeof goals.youtube.current === 'number' ? goals.youtube.current : 0}
                  target={typeof goals.youtube.target === 'number' ? goals.youtube.target : 0}
                  unit={goals.youtube.unit}
                  trend={15}
                  color="red"
                />
                <ProgressCard
                  title="マーケティング"
                  current={typeof goals.marketing.current === 'number' ? goals.marketing.current : 0}
                  target={typeof goals.marketing.target === 'number' ? goals.marketing.target : 0}
                  unit={goals.marketing.unit}
                  trend={-2}
                  color="blue"
                />
                <ProgressCard
                  title="ビジネス"
                  current={calculateCategoryProgress('business')}
                  target={100}
                  unit="%"
                  trend={12}
                  color="yellow"
                />
                <ProgressCard
                  title="読書"
                  current={typeof goals.reading.current === 'number' ? goals.reading.current : 0}
                  target={typeof goals.reading.target === 'number' ? goals.reading.target : 0}
                  unit={goals.reading.unit}
                  trend={8}
                  color="pink"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                <ProgressCard
                  title="TOPFORM"
                  current={typeof goals.topform.current === 'number' ? goals.topform.current : 0}
                  target={typeof goals.topform.target === 'number' ? goals.topform.target : 0}
                  unit={goals.topform.unit}
                  trend={3}
                  color="gray"
                />
              </div>
            </section>

            {/* Weekly Schedule */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-white">週間スケジュール</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <WeeklyTimeline
                  tasks={tasks}
                  currentWeek={currentWeek}
                  onTaskToggle={handleTaskToggle}
                  onAddTaskToDate={handleAddTaskToDate}
                  onWeekChange={handleWeekChange}
                />
                <WeeklyCalendar
                  tasks={tasks}
                  currentWeek={currentWeek}
                  onTaskToggle={handleTaskToggle}
                  onTaskDateUpdate={handleTaskDateUpdate}
                  onAddTaskToDate={handleAddTaskToDate}
                  onSelectExistingTask={handleSelectExistingTask}
                  onWeekChange={handleWeekChange}
                />
              </div>
            </section>

            {/* Task Categories */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-white">タスク管理</h2>
                {timePeriodFilter !== 'all' && (
                  <span className="px-2.5 py-1 bg-primary-cyan/20 text-primary-cyan text-sm rounded-full border border-primary-cyan/30">
                    {{ today: '今日', week: '今週', month: '今月' }[timePeriodFilter]}フィルター中
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {allCategories.map(cat => {
                  const filteredTasks = getFilteredTasksByCategory(cat.id);
                  if (timePeriodFilter !== 'all' && filteredTasks.length === 0) return null;
                  return (
                    <TaskCategory
                      key={cat.id}
                      category={cat.id}
                      categoryName={cat.name}
                      customIcon={'icon' in cat ? cat.icon : undefined}
                      customColor={'color' in cat ? cat.color : undefined}
                      tasks={filteredTasks}
                      onTaskToggle={handleTaskToggle}
                      onTaskUpdate={handleTaskUpdate}
                      onTaskAdd={(category) => {
                        setDefaultCategory(category);
                        setIsTaskModalOpen(true);
                      }}
                      onTaskEdit={handleEditTask}
                      onTaskDelete={handleDeleteTask}
                      onTaskMove={handleTaskMove}
                      progress={calculateCategoryProgress(cat.id)}
                      currentWeek={currentWeek}
                    />
                  );
                })}
              </div>
            </section>

            {/* Recurring Tasks */}
            <section className="space-y-6">
              <RecurringTasksPanel
                tasks={tasks}
                onTaskEdit={handleEditTask}
                onTaskDelete={handleDeleteTask}
              />
            </section>

            <section className="space-y-6">
              <ReflectionForm
                value={reflection}
                onChange={handleReflectionChange}
                onSave={handleSaveReflection}
                onGenerateInsight={handleGenerateInsight}
                isSaving={saveStatus === 'saving'}
                isGeneratingInsight={isGenerating}
                lastSavedAt={lastSavedAt}
              />

              {saveStatus === 'error' && saveError && (
                <div className="card border border-red-500/40 bg-red-500/10 text-red-200 px-4 py-3 text-sm">
                  {saveError}
                </div>
              )}

              <AIInsightPanel
                insight={currentInsight}
                error={aiError}
                onRegenerate={handleGenerateInsight}
                isGenerating={isGenerating}
              />
            </section>

            {/* SNS Goals Weekly Update */}
            <section className="space-y-6">
              <SNSGoalsEditor />
            </section>

            {/* Long-term Goals */}
            <section className="space-y-6">
              <LongTermGoalsPanel />
            </section>
          </div>
        )}

        {currentView === 'analytics' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-white">分析ダッシュボード</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnalyticsCard
                title="学習効率"
                value="85%"
                subtitle="前週比 +12%"
                trend={12}
                color="green"
                icon="📚"
              />
              <AnalyticsCard
                title="システム化進捗"
                value="67%"
                subtitle="効率化タスク完了率"
                trend={8}
                color="blue"
                icon="⚙️"
              />
              <AnalyticsCard
                title="エネルギー効率"
                value="1.3x"
                subtitle="高エネルギータスク最適化"
                trend={-5}
                color="orange"
                icon="⚡"
              />
            </div>
          </div>
        )}

        {currentView === 'history' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-white">履歴</h2>
            {entries.length === 0 ? (
              <div className="card p-6 text-[#888]">
                まだ履歴はありません。週次リフレクションを保存するとここに表示されます。
              </div>
            ) : (
              <div className="grid gap-4">
                {entries
                  .slice()
                  .reverse()
                  .map((entry) => (
                    <div key={entry.id} className="card card-hover p-5 space-y-4">
                      <header className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            第{entry.weekNumber}週 {entry.dateRange}
                          </h3>
                          <p className="text-xs text-[#888]">
                            保存: {new Date(entry.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-sm text-[#ccc]">
                          完了率: <span className="text-primary-cyan font-semibold">{entry.metrics.completionRate}%</span>
                        </div>
                      </header>

                      <div className="grid md:grid-cols-2 gap-4 text-sm text-[#ddd]">
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold uppercase text-primary-cyan">Wins</h4>
                          <p className="leading-relaxed bg-[#141414] border border-[#252525] rounded-lg p-3">
                            {entry.reflection.wins || '—'}
                          </p>
                          <h4 className="text-xs font-semibold uppercase text-primary-cyan">Challenges</h4>
                          <p className="leading-relaxed bg-[#141414] border border-[#252525] rounded-lg p-3">
                            {entry.reflection.challenges || '—'}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold uppercase text-primary-cyan">Learnings</h4>
                          <p className="leading-relaxed bg-[#141414] border border-[#252525] rounded-lg p-3">
                            {entry.reflection.learnings || '—'}
                          </p>
                          <h4 className="text-xs font-semibold uppercase text-primary-cyan">Focus Next Week</h4>
                          <p className="leading-relaxed bg-[#141414] border border-[#252525] rounded-lg p-3">
                            {entry.reflection.focusNextWeek || '—'}
                          </p>
                        </div>
                      </div>

                      {entry.aiInsight && (
                        <div className="border border-primary-green/30 bg-primary-green/10 rounded-lg p-4 text-sm text-[#f0f0f0]">
                          <div className="text-xs uppercase tracking-wide text-primary-green/80 mb-2">AI Insight</div>
                          <div className="space-y-2">
                            <p className="font-medium text-primary-cyan">{entry.aiInsight.summary}</p>
                            <ul className="list-disc pl-5 space-y-1">
                              {entry.aiInsight.recommendations.map((rec, index) => (
                                <li key={index}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleUpdateTask}
        title={editingTask ? "タスクを編集" : "新しいタスクを追加"}
        editingTask={editingTask}
        defaultCategory={defaultCategory}
        defaultTaskData={defaultTaskData}
        customCategories={customCategories}
      />

      {/* Task Rollover Modal */}
      <TaskRolloverModal
        isOpen={showRolloverModal}
        onClose={handleSkipRollover}
        onConfirm={handleConfirmRollover}
        onSkip={handleSkipRollover}
        incompleteTasks={incompleteTasks}
        fromDate={rolloverFromDate}
        toDate={rolloverToDate}
      />

      {/* Task Select Modal */}
      <TaskSelectModal
        isOpen={showTaskSelectModal}
        onClose={() => setShowTaskSelectModal(false)}
        onTaskSelect={handleTaskSelect}
        tasks={tasks}
        selectedDate={selectedDateForTask}
      />

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
        customCategories={customCategories}
        onAdd={addCategory}
        onUpdate={updateCategory}
        onDelete={deleteCategory}
      />
    </div>
  );
};