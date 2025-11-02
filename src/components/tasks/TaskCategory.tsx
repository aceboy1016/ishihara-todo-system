import React, { useRef, useState, useMemo } from 'react';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { useDrop } from 'react-dnd';
import { TaskItem } from './TaskItem';
import type { Task } from '../../types';
import { sortTasksByCustomDateRange } from '../../utils/taskSorting';
import { getWeekDates } from '../../utils/dateUtils';
import clsx from 'clsx';

interface TaskCategoryProps {
  category: 'note' | 'standfm' | 'instagram' | 'youtube' | 'expertise' | 'marketing' | 'business' | 'topform' | 'private' | 'other' | 'reading';
  categoryName: string;
  tasks: Task[];
  onTaskToggle: (taskId: number) => void;
  onTaskUpdate: (taskId: number, updates: Partial<Task>) => void;
  onTaskAdd?: (category?: Task['category']) => void;
  onTaskMove?: (taskId: number, newCategory: string) => void;
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (taskId: number) => void;
  progress: number;
  currentWeek?: number;
}

const categoryConfig = {
  note: {
    icon: '📝',
    color: 'teal',
    gradient: 'from-teal-500/20 to-cyan-600/20',
    border: 'border-teal-500/30',
    accent: 'text-teal-400'
  },
  standfm: {
    icon: '🎙️',
    color: 'orange',
    gradient: 'from-orange-500/20 to-red-600/20',
    border: 'border-orange-500/30',
    accent: 'text-orange-400'
  },
  instagram: {
    icon: '📷',
    color: 'pink',
    gradient: 'from-pink-500/20 to-rose-600/20',
    border: 'border-pink-500/30',
    accent: 'text-pink-400'
  },
  youtube: {
    icon: '📺',
    color: 'red',
    gradient: 'from-red-500/20 to-rose-600/20',
    border: 'border-red-500/30',
    accent: 'text-red-400'
  },
  expertise: {
    icon: '🎯',
    color: 'teal',
    gradient: 'from-teal-500/20 to-cyan-600/20',
    border: 'border-teal-500/30',
    accent: 'text-teal-400'
  },
  marketing: {
    icon: '📈',
    color: 'blue',
    gradient: 'from-blue-500/20 to-indigo-600/20',
    border: 'border-blue-500/30',
    accent: 'text-blue-400'
  },
  business: {
    icon: '💼',
    color: 'yellow',
    gradient: 'from-yellow-500/20 to-orange-600/20',
    border: 'border-yellow-500/30',
    accent: 'text-yellow-400'
  },
  topform: {
    icon: '🏢',
    color: 'red',
    gradient: 'from-red-500/20 to-rose-600/20',
    border: 'border-red-500/30',
    accent: 'text-red-400'
  },
  private: {
    icon: '🏠',
    color: 'purple',
    gradient: 'from-purple-500/20 to-violet-600/20',
    border: 'border-purple-500/30',
    accent: 'text-purple-400'
  },
  other: {
    icon: '📌',
    color: 'gray',
    gradient: 'from-gray-500/20 to-slate-600/20',
    border: 'border-gray-500/30',
    accent: 'text-gray-400'
  },
  reading: {
    icon: '📚',
    color: 'purple',
    gradient: 'from-purple-500/20 to-violet-600/20',
    border: 'border-purple-500/30',
    accent: 'text-purple-400'
  }
};

export const TaskCategory: React.FC<TaskCategoryProps> = ({
  category,
  categoryName,
  tasks,
  onTaskToggle,
  onTaskUpdate,
  onTaskAdd,
  onTaskMove,
  onTaskEdit,
  onTaskDelete,
  progress,
  currentWeek = 40
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const config = categoryConfig[category];

  const categoryRef = useRef<HTMLDivElement | null>(null);
  const [{ isOver }, drop] = useDrop({
    accept: 'task',
    drop: (item: { id: number; category: string }) => {
      if (item.category !== category && onTaskMove) {
        onTaskMove(item.id, category);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // TOPFORMカテゴリーの場合は週の日付範囲に基づいてソート
  const sortedTasks = useMemo(() => {
    if (category === 'topform') {
      // 現在の週の日付を取得
      const { start } = getWeekDates(currentWeek);
      const startDay = start.getDate();
      const endDay = Math.min(startDay + 6, 31); // 7日間、月末を超えない

      return sortTasksByCustomDateRange(tasks, startDay, endDay);
    }
    return tasks;
  }, [tasks, category, currentWeek]);

  const completedTasks = sortedTasks.filter(task => task.completed).length;
  const totalTasks = sortedTasks.length;

  const priorityTasks = {
    S: sortedTasks.filter(task => task.priority === 'S'),
    A: sortedTasks.filter(task => task.priority === 'A'),
    B: sortedTasks.filter(task => task.priority === 'B')
  };

  const getProgressColor = () => {
    if (progress >= 80) return 'from-emerald-500 to-green-600';
    if (progress >= 60) return 'from-blue-500 to-indigo-600';
    if (progress >= 40) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-rose-600';
  };

  drop(categoryRef);

  return (
    <div
      ref={categoryRef}
      className={clsx(
        'card',
        'bg-gradient-to-br', config.gradient,
        'border', config.border,
        'transition-all duration-200',
        isOver && 'ring-2 ring-primary-cyan ring-opacity-50 scale-102'
      )}>
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center space-x-2">
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
              <span className="text-xl">{config.icon}</span>
            </div>
            <div className="text-left">
              <h3 className={clsx('text-lg font-bold', config.accent)}>
                {categoryName}
              </h3>
              <div className="text-xs text-slate-400">
                {completedTasks}/{totalTasks} 完了
              </div>
            </div>
          </button>

          <div className="flex items-center space-x-3">
            {/* Progress Circle */}
            <div className="relative w-12 h-12">
              <svg className="w-12 h-12 transform -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="transparent"
                  className="text-slate-600"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="url(#progress-gradient)"
                  strokeWidth="3"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 20}`}
                  strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress / 100)}`}
                  className="transition-all duration-500 ease-out"
                />
                <defs>
                  <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" className={`${getProgressColor().split(' ')[0].replace('from-', 'text-')}`} />
                    <stop offset="100%" className={`${getProgressColor().split(' ')[1].replace('to-', 'text-')}`} />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={clsx('text-xs font-bold', config.accent)}>
                  {progress}%
                </span>
              </div>
            </div>

            {/* Add Task Button */}
            {onTaskAdd && (
              <button
                onClick={() => onTaskAdd(category)}
                className={clsx(
                  'p-2 rounded-lg border transition-colors',
                  'hover:bg-white opacity-10',
                  config.border,
                  'text-slate-300 hover:text-white'
                )}
                title="タスクを追加"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="w-full bg-slate-700/50 rounded-full h-2">
            <div
              className={clsx(
                'h-full rounded-full transition-all duration-1000 ease-out',
                `bg-gradient-to-r ${getProgressColor()}`
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Task Summary */}
        {!isCollapsed && (
          <div className="mt-3 flex items-center space-x-4 text-xs text-slate-400">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span>S優先: {priorityTasks.S.length}</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              <span>A優先: {priorityTasks.A.length}</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>B優先: {priorityTasks.B.length}</span>
            </div>
          </div>
        )}
      </div>

      {/* Task List */}
      {!isCollapsed && (
        <div className="p-4 space-y-3">
          {sortedTasks.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <div className="text-4xl mb-2">📝</div>
              <p className="text-sm">タスクがありません</p>
              <p className="text-xs mt-1">「+」ボタンでタスクを追加しましょう</p>
            </div>
          ) : (
            <div className="space-y-2">
              {category === 'topform' ? (
                // TOPFORMの場合：日付ベースでソート済みのタスクを表示
                <>
                  <div className="text-xs text-slate-400 mb-3 px-2">
                    📅 {(() => {
                      const { start } = getWeekDates(currentWeek);
                      const startDay = start.getDate();
                      const endDay = Math.min(startDay + 6, 31);
                      return `${startDay}-${endDay}日のタスクを優先表示中`;
                    })()}
                  </div>
                  {sortedTasks.map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={onTaskToggle}
                      onUpdate={onTaskUpdate}
                      onEdit={onTaskEdit}
                      onDelete={onTaskDelete}
                    />
                  ))}
                </>
              ) : category === 'reading' ? (
                // 読書の場合：読書中と読了に分けて表示
                <>
                  {/* 読書中セクション */}
                  <div className="space-y-2">
                    <div className="text-xs text-slate-400 mb-2 px-2 flex items-center gap-1">
                      📖 読書中
                    </div>
                    {sortedTasks.filter(task => task.readingStatus === 'reading').map(task => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onToggle={onTaskToggle}
                        onUpdate={onTaskUpdate}
                        onEdit={onTaskEdit}
                        onDelete={onTaskDelete}
                      />
                    ))}
                  </div>

                  {/* 読了セクション */}
                  <div className="space-y-2 mt-4">
                    <div className="text-xs text-slate-400 mb-2 px-2 flex items-center gap-1">
                      ✅ 読了
                    </div>
                    {sortedTasks.filter(task => task.readingStatus === 'completed').map(task => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onToggle={onTaskToggle}
                        onUpdate={onTaskUpdate}
                        onEdit={onTaskEdit}
                        onDelete={onTaskDelete}
                      />
                    ))}
                  </div>
                </>
              ) : (
                // その他のカテゴリー：従来通り優先度別に表示
                <>
                  {/* Priority S Tasks */}
                  {priorityTasks.S.map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={onTaskToggle}
                      onUpdate={onTaskUpdate}
                      onEdit={onTaskEdit}
                      onDelete={onTaskDelete}
                    />
                  ))}

                  {/* Priority A Tasks */}
                  {priorityTasks.A.map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={onTaskToggle}
                      onUpdate={onTaskUpdate}
                      onEdit={onTaskEdit}
                      onDelete={onTaskDelete}
                    />
                  ))}

                  {/* Priority B Tasks */}
                  {priorityTasks.B.map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={onTaskToggle}
                      onUpdate={onTaskUpdate}
                      onEdit={onTaskEdit}
                      onDelete={onTaskDelete}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};