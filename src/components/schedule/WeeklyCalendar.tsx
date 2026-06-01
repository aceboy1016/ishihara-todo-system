import React, { useMemo } from 'react';
import { Calendar, AlertCircle, Plus, ChevronLeft, ChevronRight, ListPlus } from 'lucide-react';
import { useDrag, useDrop } from 'react-dnd';
import type { Task } from '../../types';
import {
  getScheduledTasksForWeek,
  generateDateRange,
  formatDayOfWeek,
  shortenTaskTitle,
  type ScheduledTask
} from '../../utils/scheduleUtils';
import { getWeekDates, getCurrentWeekNumber } from '../../utils/dateUtils';
import clsx from 'clsx';

interface WeeklyCalendarProps {
  tasks: Task[];
  currentWeek: number;
  onTaskToggle: (taskId: number) => void;
  onDateClick?: (date: Date) => void;
  onTaskDateUpdate?: (taskId: number, newDate: Date) => void;
  onAddTaskToDate?: (date: Date) => void;
  onSelectExistingTask?: (date: Date) => void;
  onWeekChange?: (weekNumber: number) => void;
}

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  tasks,
  currentWeek,
  onTaskToggle,
  onDateClick,
  onTaskDateUpdate,
  onAddTaskToDate,
  onSelectExistingTask,
  onWeekChange
}) => {
  const { start: weekStart, end: weekEnd } = getWeekDates(currentWeek);
  const currentWeekNumber = getCurrentWeekNumber();

  const scheduledTasks = useMemo(() => {
    return getScheduledTasksForWeek(tasks, weekStart, weekEnd);
  }, [tasks, weekStart, weekEnd]);

  const dateRange = useMemo(() => {
    return generateDateRange(weekStart, weekEnd);
  }, [weekStart, weekEnd]);

  const getTasksForDate = (date: Date): ScheduledTask[] => {
    // タイムゾーンの問題を回避するため、ISO文字列の日付部分で比較
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    return scheduledTasks.filter(task => {
      const taskDate = task.scheduledDate;
      const taskDateStr = `${taskDate.getFullYear()}-${String(taskDate.getMonth() + 1).padStart(2, '0')}-${String(taskDate.getDate()).padStart(2, '0')}`;

      return dateStr === taskDateStr;
    });
  };

  const getDateMetrics = (date: Date) => {
    const dayTasks = getTasksForDate(date);
    const completed = dayTasks.filter(t => t.completed).length;
    const total = dayTasks.length;
    const highPriority = dayTasks.filter(t => t.priority === 'S').length;

    return { completed, total, highPriority };
  };

  // ドラッグ可能なタスクコンポーネント
  const DraggableTask: React.FC<{ task: ScheduledTask }> = ({ task }) => {
    const [{ isDragging }, drag] = useDrag({
      type: 'scheduled-task',
      item: { taskId: task.id, fromDate: task.scheduledDate },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });

    return (
      <div
        ref={drag}
        className={clsx(
          'text-xs px-1 py-0.5 rounded border cursor-move transition-all',
          isDragging && 'opacity-50',
          task.completed
            ? 'bg-green-50 border-green-300 text-[#374151] line-through opacity-60'
            : task.priority === 'S'
              ? 'bg-red-50 border-red-300 text-[#111827] font-medium'
              : task.priority === 'A'
                ? 'bg-orange-50 border-orange-300 text-[#111827] font-medium'
                : 'bg-blue-50 border-blue-300 text-[#111827]'
        )}
        title={task.title}
        onClick={(e) => {
          e.stopPropagation();
          onTaskToggle(task.id);
        }}
      >
        {shortenTaskTitle(task.title).substring(0, 8)}
      </div>
    );
  };

  // ドロップ可能な日付セルコンポーネント
  const DroppableDay: React.FC<{ date: Date; children: React.ReactNode }> = ({ date, children }) => {
    const [{ isOver }, drop] = useDrop({
      accept: 'scheduled-task',
      drop: (item: { taskId: number; fromDate: Date }) => {
        if (onTaskDateUpdate) {
          onTaskDateUpdate(item.taskId, date);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    });

    return (
      <div
        ref={drop}
        className={clsx(
          'relative',
          isOver && 'ring-2 ring-primary-cyan ring-opacity-50'
        )}
      >
        {children}
      </div>
    );
  };

  // マウスホイールでの週移動（無効化）
  // useEffect(() => {
  //   if (!onWeekChange) return;

  //   const handleWheel = (e: WheelEvent) => {
  //     // カレンダー内でスクロール時のみ反応
  //     const target = e.target as HTMLElement;
  //     const calendarElement = document.querySelector('[data-weekly-calendar]');

  //     if (calendarElement && calendarElement.contains(target)) {
  //       e.preventDefault();

  //       if (e.deltaY > 0) {
  //         // 下スクロール = 次の週
  //         onWeekChange(currentWeek + 1);
  //       } else if (e.deltaY < 0) {
  //         // 上スクロール = 前の週
  //         onWeekChange(currentWeek - 1);
  //       }
  //     }
  //   };

  //   document.addEventListener('wheel', handleWheel, { passive: false });

  //   return () => {
  //     document.removeEventListener('wheel', handleWheel);
  //   };
  // }, [currentWeek, onWeekChange]);

  return (
    <div className="card p-6" data-weekly-calendar>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Calendar className="h-5 w-5 text-primary-green" />
          <h3 className="text-lg font-bold text-[#111827]">週間カレンダー</h3>
        </div>

        <div className="flex items-center space-x-4">
          {/* 週移動ボタン */}
          {onWeekChange && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onWeekChange(currentWeek - 1)}
                className="p-2 hover:bg-[#f3f4f6] rounded-lg transition-colors text-[#6b7280] hover:text-[#111827]"
                title="前の週"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="text-sm text-[#6b7280] min-w-[60px] text-center">
                第{currentWeek}週
              </div>
              <button
                onClick={() => onWeekChange(currentWeek + 1)}
                className="p-2 hover:bg-[#f3f4f6] rounded-lg transition-colors text-[#6b7280] hover:text-[#111827]"
                title="次の週"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              {/* 現在ボタン（当週以外の時に表示） */}
              {currentWeek !== currentWeekNumber && (
                <button
                  onClick={() => {
                    onWeekChange(currentWeekNumber);
                  }}
                  className="px-3 py-1 text-xs bg-primary-cyan hover:bg-primary-cyan/80 text-[#111827] rounded-full transition-colors font-medium"
                  title={`今週（第${currentWeekNumber}週）に戻る`}
                >
                  現在
                </button>
              )}
            </div>
          )}

          {/* onWeekChangeがない場合は従来通り */}
          {!onWeekChange && (
            <div className="text-sm text-[#6b7280]">
              第{currentWeek}週
            </div>
          )}
        </div>
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 gap-2">
        {dateRange.map((date, index) => {
          const dayTasks = getTasksForDate(date);
          const metrics = getDateMetrics(date);
          const isToday = new Date().toDateString() === date.toDateString();
          const hasHighPriority = metrics.highPriority > 0;

          return (
            <DroppableDay key={index} date={date}>
              <div
                className={clsx(
                  'aspect-square p-2 rounded-lg border cursor-pointer transition-all relative',
                  isToday
                    ? 'bg-primary-cyan/20 border-primary-cyan/50'
                    : dayTasks.length > 0
                      ? 'bg-white border-[#d1d5db]/50 hover:bg-[#f3f4f6]/70'
                      : 'bg-[#f9fafb]/30 border-[#e5e7eb] hover:bg-[#f9fafb]/50'
                )}
                onClick={() => onDateClick?.(date)}
              >
              {/* 日付 */}
              <div className={clsx(
                'text-sm font-medium mb-1',
                isToday ? 'text-primary-cyan' : 'text-[#111827]'
              )}>
                {date.getDate()}
              </div>

              {/* 曜日 */}
              <div className={clsx(
                'text-xs mb-2',
                isToday ? 'text-primary-cyan/80' : 'text-[#6b7280]'
              )}>
                {formatDayOfWeek(date)}
              </div>

              {/* タスク表示 */}
              <div className="space-y-1">
                {/* 高優先度アラート */}
                {hasHighPriority && (
                  <div className="absolute top-1 right-1">
                    <AlertCircle className="h-3 w-3 text-red-500" />
                  </div>
                )}

                {/* タスク名表示（全件表示） */}
                {dayTasks.length > 0 && (
                  <div className="space-y-1">
                    {dayTasks.map(task => (
                      <DraggableTask key={task.id} task={task} />
                    ))}
                  </div>
                )}

                {/* タスクを追加ボタン */}
                {onAddTaskToDate && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddTaskToDate(date);
                    }}
                    className="w-full flex items-center justify-center space-x-1 py-1 text-xs text-[#6b7280] hover:text-primary-cyan hover:bg-[#f3f4f6] rounded transition-colors"
                    title="新規タスクを追加"
                  >
                    <Plus className="h-3 w-3" />
                    <span>新規</span>
                  </button>
                )}

                {/* 既存タスクを追加ボタン */}
                {onSelectExistingTask && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectExistingTask(date);
                    }}
                    className="w-full flex items-center justify-center space-x-1 py-1 text-xs text-[#6b7280] hover:text-primary-green hover:bg-[#f3f4f6] rounded transition-colors"
                    title="既存タスクを追加"
                  >
                    <ListPlus className="h-3 w-3" />
                    <span>既存</span>
                  </button>
                )}

                {/* 進捗バー */}
                {metrics.total > 0 && (
                  <div className="w-full bg-[#f3f4f6] rounded-full h-1 mt-1">
                    <div
                      className="bg-green-400 h-1 rounded-full transition-all"
                      style={{
                        width: `${(metrics.completed / metrics.total) * 100}%`
                      }}
                    />
                  </div>
                )}

                {/* タスク数表示 */}
                <div className="text-xs text-[#6b7280] text-center">
                  {dayTasks.length > 0 ? `${metrics.completed}/${metrics.total}` : '0'}
                </div>
              </div>
              </div>
            </DroppableDay>
          );
        })}
      </div>

      {/* 凡例 */}
      <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-[#6b7280]">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
          <span>S優先</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
          <span>A優先</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
          <span>B優先</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span>完了</span>
        </div>
      </div>
    </div>
  );
};