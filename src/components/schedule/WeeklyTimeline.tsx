import React, { useMemo } from 'react';
import { Calendar, Clock, CheckCircle, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Task } from '../../types';
import {
  getScheduledTasksForWeek,
  generateDateRange,
  formatDayOfWeek,
  getPriorityColor,
  getEnergyIcon,
  shortenTaskTitle,
  type ScheduledTask
} from '../../utils/scheduleUtils';
import { getWeekDates, getCurrentWeekNumber } from '../../utils/dateUtils';
import clsx from 'clsx';

interface WeeklyTimelineProps {
  tasks: Task[];
  currentWeek: number;
  onTaskToggle: (taskId: number) => void;
  onAddTaskToDate?: (date: Date) => void;
  onWeekChange?: (weekNumber: number) => void;
}

export const WeeklyTimeline: React.FC<WeeklyTimelineProps> = ({
  tasks,
  currentWeek,
  onTaskToggle,
  onAddTaskToDate,
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
    return scheduledTasks.filter(task => {
      const taskDate = task.scheduledDate;
      return taskDate.getDate() === date.getDate() &&
             taskDate.getMonth() === date.getMonth() &&
             taskDate.getFullYear() === date.getFullYear();
    });
  };

  if (scheduledTasks.length === 0) {
    return (
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Calendar className="h-6 w-6 text-primary-cyan" />
          <h3 className="text-lg font-bold text-white">週間スケジュール</h3>
        </div>
        <div className="text-center py-8 text-slate-400">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>この週にスケジュールされたタスクはありません</p>
          <div className="text-xs mt-2 opacity-60">
            週間範囲: {weekStart.getMonth() + 1}/{weekStart.getDate()} - {weekEnd.getMonth() + 1}/{weekEnd.getDate()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Calendar className="h-6 w-6 text-primary-cyan" />
          <h3 className="text-lg font-bold text-white">週間スケジュール</h3>
        </div>

        <div className="flex items-center space-x-4">
          {/* 週移動ボタン */}
          {onWeekChange && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onWeekChange(currentWeek - 1)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                title="前の週"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="text-sm text-slate-400 min-w-[60px] text-center">
                第{currentWeek}週
              </div>
              <button
                onClick={() => onWeekChange(currentWeek + 1)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
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
                  className="px-3 py-1 text-xs bg-primary-cyan hover:bg-primary-cyan/80 text-white rounded-full transition-colors font-medium"
                  title={`今週（第${currentWeekNumber}週）に戻る`}
                >
                  現在
                </button>
              )}
            </div>
          )}

          {/* onWeekChangeがない場合は従来通り */}
          {!onWeekChange && (
            <div className="text-sm text-slate-400">
              第{currentWeek}週 • {scheduledTasks.length}件のタスク
            </div>
          )}
        </div>
      </div>

      {/* タイムライン表示 */}
      <div className="space-y-3">
        {dateRange.map((date, index) => {
          const dayTasks = getTasksForDate(date);
          const isToday = new Date().toDateString() === date.toDateString();

          return (
            <div
              key={index}
              className={clsx(
                'flex items-start space-x-4 p-3 rounded-lg border transition-colors',
                isToday
                  ? 'bg-primary-cyan/10 border-primary-cyan/30'
                  : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70'
              )}
            >
              {/* 日付表示 */}
              <div className="flex-shrink-0 text-center min-w-[60px]">
                <div className={clsx(
                  'text-lg font-bold',
                  isToday ? 'text-primary-cyan' : 'text-white'
                )}>
                  {date.getDate()}
                </div>
                <div className={clsx(
                  'text-xs',
                  isToday ? 'text-primary-cyan/80' : 'text-slate-400'
                )}>
                  {formatDayOfWeek(date)}
                </div>
              </div>

              {/* タスクリスト */}
              <div className="flex-1 min-w-0">
                {dayTasks.length === 0 ? (
                  <div className="text-slate-500 text-sm py-2">
                    スケジュールなし
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dayTasks.map(task => (
                      <div
                        key={task.id}
                        className={clsx(
                          'flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer',
                          getPriorityColor(task.priority),
                          task.completed && 'opacity-60'
                        )}
                        onClick={() => onTaskToggle(task.id)}
                      >
                        {/* チェックボックス */}
                        <div className="flex-shrink-0">
                          {task.completed ? (
                            <CheckCircle className="h-5 w-5 text-green-400" />
                          ) : (
                            <div className="h-5 w-5 border-2 border-current rounded-full"></div>
                          )}
                        </div>

                        {/* タスク情報 */}
                        <div className="flex-1 min-w-0">
                          <div className={clsx(
                            'font-medium text-sm',
                            task.completed && 'line-through'
                          )}>
                            {shortenTaskTitle(task.title)}
                          </div>
                          <div className="flex items-center space-x-2 text-xs opacity-80 mt-1">
                            <span className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{task.estimatedHours}h</span>
                            </span>
                            <span>{getEnergyIcon(task.energy)}</span>
                            <span className="px-2 py-0.5 bg-current/20 rounded-full">
                              {task.priority}
                            </span>
                          </div>
                        </div>
                      </div>
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
                    className="w-full flex items-center justify-center space-x-2 mt-2 py-2 text-xs text-slate-400 hover:text-primary-cyan hover:bg-slate-700/50 rounded transition-colors border border-dashed border-slate-600 hover:border-primary-cyan"
                    title="タスクを追加"
                  >
                    <Plus className="h-4 w-4" />
                    <span>タスクを追加</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 統計情報 */}
      <div className="mt-6 grid grid-cols-3 gap-4 text-center">
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-2xl font-bold text-white">
            {scheduledTasks.length}
          </div>
          <div className="text-xs text-slate-400">総タスク</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-400">
            {scheduledTasks.filter(t => t.completed).length}
          </div>
          <div className="text-xs text-slate-400">完了</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-2xl font-bold text-orange-400">
            {scheduledTasks.reduce((sum, t) => sum + t.estimatedHours, 0)}h
          </div>
          <div className="text-xs text-slate-400">予定時間</div>
        </div>
      </div>
    </div>
  );
};