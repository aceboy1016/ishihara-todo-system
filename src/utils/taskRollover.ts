import type { Task } from '../types';

/**
 * 指定した日付の未完了タスクを検出する
 */
export function getIncompleteTasksForDate(tasks: Task[], targetDate: Date): Task[] {
  const dateString = targetDate.toISOString().split('T')[0];

  return tasks.filter(task => {
    // 指定日に予定されていて、未完了のタスク
    if (task.scheduledDate === dateString && !task.completed) {
      return true;
    }

    // 繰り返しタスクの場合は、その日に発生予定で未完了のもの
    if (task.isRecurring && task.scheduledDate && !task.completed) {
      const taskDate = new Date(task.scheduledDate);
      if (shouldRecurOnDate(task, taskDate, targetDate)) {
        return true;
      }
    }

    return false;
  });
}

/**
 * 繰り返しタスクが指定日に発生するかを判定
 */
function shouldRecurOnDate(task: Task, baseDate: Date, targetDate: Date): boolean {
  if (!task.isRecurring || !task.recurringType) return false;

  const interval = task.recurringInterval || 1;

  switch (task.recurringType) {
    case 'daily': {
      const diffTime = targetDate.getTime() - baseDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays % interval === 0;
    }

    case 'weekly': {
      if (targetDate.getDay() === baseDate.getDay()) {
        const diffTime = targetDate.getTime() - baseDate.getTime();
        const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
        return diffWeeks >= 0 && diffWeeks % interval === 0;
      }
      return false;
    }

    case 'monthly': {
      const monthsDiff = (targetDate.getFullYear() - baseDate.getFullYear()) * 12 +
                        (targetDate.getMonth() - baseDate.getMonth());

      if (monthsDiff >= 0 && monthsDiff % interval === 0) {
        return targetDate.getDate() === baseDate.getDate();
      }
      return false;
    }

    case 'yearly': {
      const yearsDiff = targetDate.getFullYear() - baseDate.getFullYear();
      return yearsDiff >= 0 &&
             yearsDiff % interval === 0 &&
             targetDate.getMonth() === baseDate.getMonth() &&
             targetDate.getDate() === baseDate.getDate();
    }

    default:
      return false;
  }
}

/**
 * 未完了タスクを次の日に繰り越す
 */
export function rolloverIncompleteTasks(
  tasks: Task[],
  fromDate: Date,
  toDate: Date
): { updatedTasks: Task[]; rolledOverTasks: Task[] } {
  const incompleteTasks = getIncompleteTasksForDate(tasks, fromDate);
  const toDateString = toDate.toISOString().split('T')[0];

  const rolledOverTasks: Task[] = [];
  const updatedTasks = tasks.map(task => {
    const isIncomplete = incompleteTasks.some(t => t.id === task.id);

    if (isIncomplete) {
      // 繰り返しタスクでない場合は日付を更新
      if (!task.isRecurring) {
        const updatedTask = {
          ...task,
          scheduledDate: toDateString,
          updatedAt: new Date().toISOString(),
          rolloverFrom: fromDate.toISOString().split('T')[0] // 繰り越し元の記録
        };
        rolledOverTasks.push(updatedTask);
        return updatedTask;
      }

      // 繰り返しタスクの場合は新しいインスタンスを作成
      const newTaskInstance: Task = {
        ...task,
        id: Math.max(...tasks.map(t => t.id)) + Math.floor(Math.random() * 1000) + 1,
        scheduledDate: toDateString,
        completed: false,
        completedDate: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        rolloverFrom: fromDate.toISOString().split('T')[0],
        title: `${task.title} (繰り越し)`
      };
      rolledOverTasks.push(newTaskInstance);
      return task; // 元のタスクは変更しない
    }

    return task;
  });

  // 繰り返しタスクの新しいインスタンスを追加
  const newRecurringInstances = rolledOverTasks.filter(task =>
    task.isRecurring && task.rolloverFrom
  );

  return {
    updatedTasks: [...updatedTasks, ...newRecurringInstances.filter(task =>
      !updatedTasks.some(existing => existing.id === task.id)
    )],
    rolledOverTasks
  };
}

/**
 * 昨日の日付を取得
 */
export function getYesterday(): Date {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday;
}

/**
 * 今日の日付を取得
 */
export function getToday(): Date {
  return new Date();
}

/**
 * 日付を YYYY-MM-DD 形式でフォーマット
 */
export function formatDateToString(date: Date): string {
  return date.toISOString().split('T')[0];
}