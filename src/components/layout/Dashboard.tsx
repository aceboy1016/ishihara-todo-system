import React, { useMemo, useState, useEffect } from 'react';
import { Header } from './Header';
import { ProgressCard } from '../analytics/ProgressCard';
import { AnalyticsCard } from '../analytics/AnalyticsCard';
import { TaskCategory } from '../tasks/TaskCategory';
import { RecurringTasksPanel } from '../tasks/RecurringTasksPanel';
import { TaskModal } from '../ui/TaskModal';
import { TaskRolloverModal } from '../ui/TaskRolloverModal';
import { TaskSelectModal } from '../ui/TaskSelectModal';
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
import { getWeekDateRange, getCurrentWeekNumber } from '../../utils/dateUtils';
import { INITIAL_GOALS, generateInitialTasks } from '../../constants/categories';
import { exportToJSON, downloadJSON } from '../../utils/exportUtils';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import {
  getIncompleteTasksForDate,
  rolloverIncompleteTasks,
  getYesterday,
  getToday,
  formatDateToString
} from '../../utils/taskRollover';
import { useWeeklyHistory, useReflectionProfile, createHistoryEntry } from '../../hooks/useWeeklyHistory';
import { useAIInsights } from '../../hooks/useAIInsights';

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
  const [defaultCategory, setDefaultCategory] = useState<Task['category'] | undefined>(undefined);
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


    let savedTasks = localStorage.getItem(weekKey);

    // Migration: If week 39 data doesn't exist but v2 data exists, migrate it
    if (!savedTasks && currentWeek === 39) {
      const v2Tasks = localStorage.getItem('strategic-todo-tasks-v2');
      if (v2Tasks) {
        localStorage.setItem(weekKey, v2Tasks);
        savedTasks = v2Tasks;
      }
    }

    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks);
        setTasks(parsedTasks);
      } catch (error) {
        console.error('Failed to load tasks for week', currentWeek, error);
        const initialTasks = generateInitialTasks();
        setTasks(initialTasks);
      }
    } else {
      const initialTasks = generateInitialTasks();
      setTasks(initialTasks);
    }
  }, [currentWeek]);

  // Save tasks to localStorage whenever tasks change
  React.useEffect(() => {
    const weekKey = `strategic-todo-tasks-week${currentWeek}`;
    localStorage.setItem(weekKey, JSON.stringify(tasks));
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

  const getTasksByCategory = (category: keyof CategoryGoals | 'private' | 'other' | 'reading') => {
    return tasks.filter(task => task.category === category);
  };

  const calculateCompletionRate = () => {
    if (tasks.length === 0) return 0;
    return Math.round((tasks.filter(task => task.completed).length / tasks.length) * 100);
  };

  const calculateCategoryProgress = (category: keyof CategoryGoals | 'private' | 'other' | 'reading') => {
    const categoryTasks = getTasksByCategory(category);
    if (categoryTasks.length === 0) return 0;
    return Math.round((categoryTasks.filter(task => task.completed).length / categoryTasks.length) * 100);
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
    <div className="min-h-screen relative">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
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
              <h2 className="text-2xl font-bold text-white">タスク管理</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TaskCategory
                  category="note"
                  categoryName="note"
                  tasks={getTasksByCategory('note')}
                  onTaskToggle={handleTaskToggle}
                  onTaskUpdate={handleTaskUpdate}
                  onTaskAdd={(category) => {
                    setDefaultCategory(category);
                    setIsTaskModalOpen(true);
                  }}
                  onTaskEdit={handleEditTask}
                  onTaskDelete={handleDeleteTask}
                  onTaskMove={handleTaskMove}
                  progress={calculateCategoryProgress('note')}
                  currentWeek={currentWeek}
                />
                <TaskCategory
                  category="standfm"
                  categoryName="standFM"
                  tasks={getTasksByCategory('standfm')}
                  onTaskToggle={handleTaskToggle}
                  onTaskUpdate={handleTaskUpdate}
                  onTaskAdd={(category) => {
                    setDefaultCategory(category);
                    setIsTaskModalOpen(true);
                  }}
                  onTaskEdit={handleEditTask}
                  onTaskDelete={handleDeleteTask}
                  onTaskMove={handleTaskMove}
                  progress={calculateCategoryProgress('standfm')}
                  currentWeek={currentWeek}
                />
                <TaskCategory
                  category="instagram"
                  categoryName="Instagram"
                  tasks={getTasksByCategory('instagram')}
                  onTaskToggle={handleTaskToggle}
                  onTaskUpdate={handleTaskUpdate}
                  onTaskAdd={(category) => {
                    setDefaultCategory(category);
                    setIsTaskModalOpen(true);
                  }}
                  onTaskEdit={handleEditTask}
                  onTaskDelete={handleDeleteTask}
                  onTaskMove={handleTaskMove}
                  progress={calculateCategoryProgress('instagram')}
                  currentWeek={currentWeek}
                />
                <TaskCategory
                  category="youtube"
                  categoryName="YouTube"
                  tasks={getTasksByCategory('youtube')}
                  onTaskToggle={handleTaskToggle}
                  onTaskUpdate={handleTaskUpdate}
                  onTaskAdd={(category) => {
                    setDefaultCategory(category);
                    setIsTaskModalOpen(true);
                  }}
                  onTaskEdit={handleEditTask}
                  onTaskDelete={handleDeleteTask}
                  onTaskMove={handleTaskMove}
                  progress={calculateCategoryProgress('youtube')}
                  currentWeek={currentWeek}
                />
                <TaskCategory
                  category="expertise"
                  categoryName="専門性開発"
                  tasks={getTasksByCategory('expertise')}
                  onTaskToggle={handleTaskToggle}
                  onTaskUpdate={handleTaskUpdate}
                  onTaskAdd={(category) => {
                    setDefaultCategory(category);
                    setIsTaskModalOpen(true);
                  }}
                  onTaskEdit={handleEditTask}
                  onTaskDelete={handleDeleteTask}
                  onTaskMove={handleTaskMove}
                  progress={calculateCategoryProgress('expertise')}
                  currentWeek={currentWeek}
                />
                <TaskCategory
                  category="marketing"
                  categoryName="マーケティング"
                  tasks={getTasksByCategory('marketing')}
                  onTaskToggle={handleTaskToggle}
                  onTaskUpdate={handleTaskUpdate}
                  onTaskAdd={(category) => {
                    setDefaultCategory(category);
                    setIsTaskModalOpen(true);
                  }}
                  onTaskEdit={handleEditTask}
                  onTaskDelete={handleDeleteTask}
                  onTaskMove={handleTaskMove}
                  progress={calculateCategoryProgress('marketing')}
                  currentWeek={currentWeek}
                />
                <TaskCategory
                  category="business"
                  categoryName="ビジネス"
                  tasks={getTasksByCategory('business')}
                  onTaskToggle={handleTaskToggle}
                  onTaskUpdate={handleTaskUpdate}
                  onTaskAdd={(category) => {
                    setDefaultCategory(category);
                    setIsTaskModalOpen(true);
                  }}
                  onTaskEdit={handleEditTask}
                  onTaskDelete={handleDeleteTask}
                  onTaskMove={handleTaskMove}
                  progress={calculateCategoryProgress('business')}
                  currentWeek={currentWeek}
                />
                <TaskCategory
                  category="topform"
                  categoryName="TOPFORM"
                  tasks={getTasksByCategory('topform')}
                  onTaskToggle={handleTaskToggle}
                  onTaskUpdate={handleTaskUpdate}
                  onTaskAdd={(category) => {
                    setDefaultCategory(category);
                    setIsTaskModalOpen(true);
                  }}
                  onTaskEdit={handleEditTask}
                  onTaskDelete={handleDeleteTask}
                  onTaskMove={handleTaskMove}
                  progress={calculateCategoryProgress('topform')}
                  currentWeek={currentWeek}
                />
                <TaskCategory
                  category="private"
                  categoryName="プライベート"
                  tasks={getTasksByCategory('private')}
                  onTaskToggle={handleTaskToggle}
                  onTaskUpdate={handleTaskUpdate}
                  onTaskAdd={(category) => {
                    setDefaultCategory(category);
                    setIsTaskModalOpen(true);
                  }}
                  onTaskEdit={handleEditTask}
                  onTaskDelete={handleDeleteTask}
                  onTaskMove={handleTaskMove}
                  progress={calculateCategoryProgress('private')}
                  currentWeek={currentWeek}
                />
                <TaskCategory
                  category="other"
                  categoryName="その他"
                  tasks={getTasksByCategory('other')}
                  onTaskToggle={handleTaskToggle}
                  onTaskUpdate={handleTaskUpdate}
                  onTaskAdd={(category) => {
                    setDefaultCategory(category);
                    setIsTaskModalOpen(true);
                  }}
                  onTaskEdit={handleEditTask}
                  onTaskDelete={handleDeleteTask}
                  onTaskMove={handleTaskMove}
                  progress={calculateCategoryProgress('other')}
                  currentWeek={currentWeek}
                />
                <TaskCategory
                  category="reading"
                  categoryName="読書"
                  tasks={getTasksByCategory('reading')}
                  onTaskToggle={handleTaskToggle}
                  onTaskUpdate={handleTaskUpdate}
                  onTaskAdd={(category) => {
                    setDefaultCategory(category);
                    setIsTaskModalOpen(true);
                  }}
                  onTaskEdit={handleEditTask}
                  onTaskDelete={handleDeleteTask}
                  onTaskMove={handleTaskMove}
                  progress={calculateCategoryProgress('reading')}
                  currentWeek={currentWeek}
                />
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
              <div className="card p-6 text-slate-400">
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
                          <p className="text-xs text-slate-400">
                            保存: {new Date(entry.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-sm text-slate-300">
                          完了率: <span className="text-primary-cyan font-semibold">{entry.metrics.completionRate}%</span>
                        </div>
                      </header>

                      <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-200">
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold uppercase text-primary-cyan">Wins</h4>
                          <p className="leading-relaxed bg-slate-900/50 border border-slate-700/60 rounded-lg p-3">
                            {entry.reflection.wins || '—'}
                          </p>
                          <h4 className="text-xs font-semibold uppercase text-primary-cyan">Challenges</h4>
                          <p className="leading-relaxed bg-slate-900/50 border border-slate-700/60 rounded-lg p-3">
                            {entry.reflection.challenges || '—'}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold uppercase text-primary-cyan">Learnings</h4>
                          <p className="leading-relaxed bg-slate-900/50 border border-slate-700/60 rounded-lg p-3">
                            {entry.reflection.learnings || '—'}
                          </p>
                          <h4 className="text-xs font-semibold uppercase text-primary-cyan">Focus Next Week</h4>
                          <p className="leading-relaxed bg-slate-900/50 border border-slate-700/60 rounded-lg p-3">
                            {entry.reflection.focusNextWeek || '—'}
                          </p>
                        </div>
                      </div>

                      {entry.aiInsight && (
                        <div className="border border-primary-green/30 bg-primary-green/10 rounded-lg p-4 text-sm text-slate-100">
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
    </div>
  );
};