import { format, startOfWeek, endOfWeek, addWeeks, differenceInWeeks, parseISO, isWithinInterval } from 'date-fns';
import { ja } from 'date-fns/locale';

export const isDateStringInWeek = (dateStr: string, week: { start: Date; end: Date }): boolean => {
  if (!dateStr) return false;
  try {
    const taskDate = parseISO(dateStr);
    return isWithinInterval(taskDate, week);
  } catch (e) {
    console.error("Invalid date string for comparison:", dateStr, e);
    return false;
  }
};

export const getCurrentWeekNumber = (): number => {
  // 日本時間で正確に計算
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // date-fnsを使って週の差分を計算（月曜始まり）
  const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const yearWeekStart = startOfWeek(startOfYear, { weekStartsOn: 1 });

  const weekNumber = Math.floor(differenceInWeeks(currentWeekStart, yearWeekStart)) + 1;

  // デバッグ用のログ（後で削除）
  console.log(`📅 Current week calculation: ${now.toDateString()} -> Week ${weekNumber}`);

  return weekNumber;
};

export const getWeekDateRange = (weekNumber: number, year?: number): string => {
  const currentYear = year || new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const targetWeek = addWeeks(startOfYear, weekNumber - 1);

  const weekStart = startOfWeek(targetWeek, { weekStartsOn: 1 }); // Monday start
  const weekEnd = endOfWeek(targetWeek, { weekStartsOn: 1 });

  return `${format(weekStart, 'yyyy/MM/dd', { locale: ja })} - ${format(weekEnd, 'MM/dd', { locale: ja })}`;
};

export const formatDate = (date: string | Date, formatStr: string = 'yyyy/MM/dd HH:mm'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: ja });
};

export const getWeekProgress = (weekNumber: number): number => {
  const currentWeek = getCurrentWeekNumber();
  if (weekNumber > currentWeek) return 0;
  if (weekNumber < currentWeek) return 100;

  // Current week progress based on day of week
  const now = new Date();
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); // Sunday = 7
  return Math.round((dayOfWeek / 7) * 100);
};

export const isCurrentWeek = (weekNumber: number): boolean => {
  return weekNumber === getCurrentWeekNumber();
};

export const isFutureWeek = (weekNumber: number): boolean => {
  return weekNumber > getCurrentWeekNumber();
};

export const isPastWeek = (weekNumber: number): boolean => {
  return weekNumber < getCurrentWeekNumber();
};

export const getRelativeWeekLabel = (weekNumber: number): string => {
  const currentWeek = getCurrentWeekNumber();
  const diff = weekNumber - currentWeek;

  if (diff === 0) return '今週';
  if (diff === -1) return '先週';
  if (diff === 1) return '来週';
  if (diff < -1) return `${Math.abs(diff)}週前`;
  if (diff > 1) return `${diff}週後`;

  return `第${weekNumber}週`;
};

export const getWeekDates = (weekNumber: number, year?: number): { start: Date; end: Date } => {
  const currentYear = year || new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const targetWeek = addWeeks(startOfYear, weekNumber - 1);

  const start = startOfWeek(targetWeek, { weekStartsOn: 1 });
  const end = endOfWeek(targetWeek, { weekStartsOn: 1 });

  return { start, end };
};

export const calculateTimeSpent = (startTime: string, endTime?: string): number => {
  const start = parseISO(startTime);
  const end = endTime ? parseISO(endTime) : new Date();

  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60)); // Hours
};

export const getOptimalWorkingHours = (energy: 'high' | 'medium' | 'low'): string[] => {
  switch (energy) {
    case 'high':
      return ['09:00-11:00', '14:00-16:00', '19:00-21:00'];
    case 'medium':
      return ['11:00-13:00', '16:00-18:00'];
    case 'low':
      return ['13:00-14:00', '18:00-19:00', '21:00-22:00'];
    default:
      return ['09:00-17:00'];
  }
};