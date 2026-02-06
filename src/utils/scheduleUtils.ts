import type { Task } from '../types';
import { parseISO } from 'date-fns';

export interface ScheduledTask {
  id: number;
  title: string;
  category: Task['category'];
  priority: Task['priority'];
  energy: Task['energy'];
  completed: boolean;
  estimatedHours: number;
  scheduledDate: Date;
  scheduledDay: number; // 日付（1-31）
  isMonthly: boolean;
  isFixed: boolean; // 固定日程かどうか
  notes?: string;
}

/**
 * タスクタイトルから日付情報を抽出
 */
export function extractScheduleFromTitle(title: string): { day: number | null; isMonthly: boolean } {
  // 【毎月X日】パターン
  const monthlyMatch = title.match(/【毎月(\d+)日】/);
  if (monthlyMatch) {
    return { day: parseInt(monthlyMatch[1], 10), isMonthly: true };
  }

  // 【X月】パターン（月単位のタスク）
  const monthMatch = title.match(/【(\d+)月】/);
  if (monthMatch) {
    return { day: null, isMonthly: false };
  }

  return { day: null, isMonthly: false };
}

/**
 * タスクタイトルを短縮表示用に変換
 */
export function shortenTaskTitle(title: string): string {
  // 【毎月X日】【場所】を削除
  let shortened = title.replace(/【毎月\d+日】/g, '');
  shortened = shortened.replace(/【[^】]*】/g, '');

  // 短縮を無効化 - 元のタイトルを返す
  return shortened.trim() || title;
}

/**
 * 繰り返しタスクの次回実行日を計算
 * @param baseDate 繰り返しの基準日
 * @param recurringType 繰り返しの種類
 * @param interval 繰り返しの間隔
 * @param targetDate チェック対象の日付
 * @returns targetDateが有効な発生日であればそのDateオブジェクト、そうでなければnull
 */
function calculateNextOccurrence(
  baseDate: Date,
  recurringType: 'daily' | 'weekly' | 'monthly' | 'yearly',
  interval: number,
  targetDate: Date
): Date | null {
  const base = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

  // 対象日が基準日より前の場合は無効
  if (target.getTime() < base.getTime()) {
    return null;
  }

  switch (recurringType) {
    case 'daily': {
      const diffTime = target.getTime() - base.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays % interval === 0) {
        return targetDate;
      }
      break;
    }

    case 'weekly': {
      if (target.getDay() === base.getDay()) {
        // より正確な週数計算のため、日付のみを使用
        const baseNormalized = new Date(base.getFullYear(), base.getMonth(), base.getDate());
        const targetNormalized = new Date(target.getFullYear(), target.getMonth(), target.getDate());

        // 基準日から対象日までの日数を計算
        const diffTime = targetNormalized.getTime() - baseNormalized.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        // 日数が7の倍数かつ、間隔に合致するかチェック
        if (diffDays >= 0 && diffDays % 7 === 0) {
          const diffWeeks = diffDays / 7;
          if (diffWeeks % interval === 0) {
            return targetDate;
          }
        }
      }
      break;
    }

    case 'monthly': {
      const monthsDiff = (target.getFullYear() - base.getFullYear()) * 12 + (target.getMonth() - base.getMonth());

      if (monthsDiff >= 0 && monthsDiff % interval === 0) {
        const baseDay = base.getDate();
        const targetDay = target.getDate();

        // 基準日とターゲットの日付が同じならOK
        if (baseDay === targetDay) {
          return targetDate;
        }

        // 月末の処理: 基準日の日付が、ターゲットの月の末日よりも大きい場合
        // (例: base 1/31, target 2月)
        const targetMonthEndDate = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
        if (baseDay > targetMonthEndDate) {
          // ターゲットの日付が、その月の末日であればOK
          // (例: target 2/28 or 2/29)
          if (targetDay === targetMonthEndDate) {
            return targetDate;
          }
        }
      }
      break;
    }

    case 'yearly': {
      if (target.getMonth() === base.getMonth() && target.getDate() === base.getDate()) {
        const yearsDiff = target.getFullYear() - base.getFullYear();
        if (yearsDiff >= 0 && yearsDiff % interval === 0) {
          return targetDate;
        }
      }
      break;
    }
  }

  return null;
}


/**
 * タスクリストから指定された年月のスケジュール付きタスクを抽出
 */
export function extractScheduledTasks(
  tasks: Task[],
  year: number,
  month: number
): ScheduledTask[] {
  const scheduledTasks: ScheduledTask[] = [];
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);

  for (const task of tasks) {
    if (task.scheduledDate) {
      const taskDate = parseISO(task.scheduledDate);

      if (task.isRecurring && task.recurringType) {
        // 繰り返しタスク: 対象月の日をループして発生日をチェック
        for (let day = 1; day <= monthEnd.getDate(); day++) {
          const checkDate = new Date(year, month - 1, day);

          const occurrence = calculateNextOccurrence(
            taskDate,
            task.recurringType,
            task.recurringInterval || 1,
            checkDate
          );

          if (occurrence) {
            // 重複追加を防止
            if (!scheduledTasks.some(t => t.id === task.id && t.scheduledDay === occurrence.getDate())) {
              scheduledTasks.push({
                id: task.id,
                title: task.title,
                category: task.category,
                priority: task.priority,
                energy: task.energy,
                completed: task.completed,
                estimatedHours: task.estimatedHours,
                scheduledDate: occurrence,
                scheduledDay: occurrence.getDate(),
                isMonthly: task.recurringType === 'monthly',
                isFixed: false,
                notes: task.notes,
              });
            }
          }
        }
      } else {
        // 単発タスク: 対象月にあるかチェック
        if (taskDate >= monthStart && taskDate <= monthEnd) {
          scheduledTasks.push({
            id: task.id,
            title: task.title,
            category: task.category,
            priority: task.priority,
            energy: task.energy,
            completed: task.completed,
            estimatedHours: task.estimatedHours,
            scheduledDate: taskDate,
            scheduledDay: taskDate.getDate(),
            isMonthly: false,
            isFixed: true,
            notes: task.notes,
          });
        }
      }
    } else {
      // フォールバック：タイトルから日付を抽出（毎月固定日のみ）
      const schedule = extractScheduleFromTitle(task.title);
      if (schedule.day && schedule.isMonthly) {
        const targetDate = new Date(year, month - 1, schedule.day);
        // その月にその日が存在する場合のみ追加
        if (targetDate.getMonth() === month - 1) {
            scheduledTasks.push({
                id: task.id,
                title: task.title,
                category: task.category,
                priority: task.priority,
                energy: task.energy,
                completed: task.completed,
                estimatedHours: task.estimatedHours,
                scheduledDate: targetDate,
                scheduledDay: schedule.day,
                isMonthly: true,
                isFixed: true,
                notes: task.notes,
            });
        }
      }
    }
  }

  return scheduledTasks.sort((a, b) => a.scheduledDay - b.scheduledDay);
}

/**
 * 週の範囲内にあるスケジュール付きタスクを取得
 */
export function getScheduledTasksForWeek(
  tasks: Task[],
  weekStart: Date,
  weekEnd: Date
): ScheduledTask[] {
  const scheduledTasks: ScheduledTask[] = [];

  for (const task of tasks) {

    if (task.scheduledDate) {
        const taskDate = parseISO(task.scheduledDate);

        if (task.isRecurring && task.recurringType) {

            // 繰り返しタスク: 週の範囲内の日をループして発生をチェック
            // タイムゾーン問題を回避するため、ローカル日付で直接操作
            let checkYear = weekStart.getFullYear();
            let checkMonth = weekStart.getMonth();
            let checkDay = weekStart.getDate();

            const endYear = weekEnd.getFullYear();
            const endMonth = weekEnd.getMonth();
            const endDay = weekEnd.getDate();

            while (
              checkYear < endYear ||
              (checkYear === endYear && checkMonth < endMonth) ||
              (checkYear === endYear && checkMonth === endMonth && checkDay <= endDay)
            ) {
                // ローカル時間で正確な日付を作成（タイムゾーンの影響なし）
                const currentDate = new Date(checkYear, checkMonth, checkDay, 12, 0, 0);

                const occurrence = calculateNextOccurrence(
                    taskDate,
                    task.recurringType,
                    task.recurringInterval || 1,
                    currentDate
                );

                if (occurrence) {
                    // ローカル時間で日付を再作成
                    const localOccurrence = new Date(
                      occurrence.getFullYear(),
                      occurrence.getMonth(),
                      occurrence.getDate(),
                      12, 0, 0
                    );

                    // 重複追加を防止
                    const occurrenceKey = `${task.id}-${localOccurrence.getFullYear()}-${localOccurrence.getMonth()}-${localOccurrence.getDate()}`;
                    if (!scheduledTasks.some(t => {
                      const tKey = `${t.id}-${t.scheduledDate.getFullYear()}-${t.scheduledDate.getMonth()}-${t.scheduledDate.getDate()}`;
                      return tKey === occurrenceKey;
                    })) {
                        scheduledTasks.push({
                            id: task.id,
                            title: task.title,
                            category: task.category,
                            priority: task.priority,
                            energy: task.energy,
                            completed: task.completed,
                            estimatedHours: task.estimatedHours,
                            scheduledDate: localOccurrence,
                            scheduledDay: localOccurrence.getDate(),
                            isMonthly: task.recurringType === 'monthly',
                            isFixed: false,
                            notes: task.notes,
                        });
                    }
                }

                // 次の日へ
                checkDay++;
                const tempDate = new Date(checkYear, checkMonth, checkDay);
                checkYear = tempDate.getFullYear();
                checkMonth = tempDate.getMonth();
                checkDay = tempDate.getDate();
            }
        } else {
            // 単発タスク - タイムゾーン問題を回避
            const localTaskDate = new Date(
              taskDate.getFullYear(),
              taskDate.getMonth(),
              taskDate.getDate(),
              12, 0, 0
            );

            const localWeekStart = new Date(
              weekStart.getFullYear(),
              weekStart.getMonth(),
              weekStart.getDate(),
              0, 0, 0
            );

            const localWeekEnd = new Date(
              weekEnd.getFullYear(),
              weekEnd.getMonth(),
              weekEnd.getDate(),
              23, 59, 59
            );

            if (localTaskDate >= localWeekStart && localTaskDate <= localWeekEnd) {
                scheduledTasks.push({
                    id: task.id,
                    title: task.title,
                    category: task.category,
                    priority: task.priority,
                    energy: task.energy,
                    completed: task.completed,
                    estimatedHours: task.estimatedHours,
                    scheduledDate: localTaskDate,
                    scheduledDay: localTaskDate.getDate(),
                    isMonthly: false,
                    isFixed: true,
                    notes: task.notes,
                });
            }
        }
    } else {
        // フォールバック：タイトルから日付を抽出（全カテゴリ対応）
        const schedule = extractScheduleFromTitle(task.title);
        if (schedule.day && schedule.isMonthly) {
            let checkYear = weekStart.getFullYear();
            let checkMonth = weekStart.getMonth();
            let checkDay = weekStart.getDate();

            const endYear = weekEnd.getFullYear();
            const endMonth = weekEnd.getMonth();
            const endDay = weekEnd.getDate();

            while (
              checkYear < endYear ||
              (checkYear === endYear && checkMonth < endMonth) ||
              (checkYear === endYear && checkMonth === endMonth && checkDay <= endDay)
            ) {
                if (checkDay === schedule.day) {
                    const localDate = new Date(checkYear, checkMonth, checkDay, 12, 0, 0);
                    scheduledTasks.push({
                        id: task.id,
                        title: task.title,
                        category: task.category,
                        priority: task.priority,
                        energy: task.energy,
                        completed: task.completed,
                        estimatedHours: task.estimatedHours,
                        scheduledDate: localDate,
                        scheduledDay: schedule.day,
                        isMonthly: true,
                        isFixed: true,
                        notes: task.notes,
                    });
                }
                // 次の日へ
                checkDay++;
                const tempDate = new Date(checkYear, checkMonth, checkDay);
                checkYear = tempDate.getFullYear();
                checkMonth = tempDate.getMonth();
                checkDay = tempDate.getDate();
            }
        }
    }
  }

  return scheduledTasks.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
}


/**
 * 日付範囲の配列を生成
 */
export function generateDateRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

/**
 * 日付フォーマット関数
 */
export function formatScheduleDate(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function formatDayOfWeek(date: Date): string {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return days[date.getDay()];
}

/**
 * 優先度に基づく色を取得
 */
export function getPriorityColor(priority: Task['priority']): string {
  switch (priority) {
    case 'S': return 'bg-red-500/20 border-red-500/40 text-red-300';
    case 'A': return 'bg-orange-500/20 border-orange-500/40 text-orange-300';
    case 'B': return 'bg-green-500/20 border-green-500/40 text-green-300';
    default: return 'bg-gray-500/20 border-gray-500/40 text-gray-300';
  }
}

/**
 * エネルギーレベルに基づくアイコンを取得
 */
export function getEnergyIcon(energy: Task['energy']): string {
  switch (energy) {
    case 'high': return '⚡';
    case 'medium': return '💡';
    case 'low': return '🔋';
    default: return '💡';
  }
}
