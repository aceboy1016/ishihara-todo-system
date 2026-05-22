import React from 'react';
import { List, Clock, CalendarDays, Calendar } from 'lucide-react';

export type TimePeriodFilter = 'all' | 'today' | 'week' | 'month';

interface TimePeriodSidebarProps {
  filter: TimePeriodFilter;
  onChange: (filter: TimePeriodFilter) => void;
  taskCounts: Record<TimePeriodFilter, number>;
}

const FILTER_OPTIONS: { key: TimePeriodFilter; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: '全て', icon: <List className="h-4 w-4" /> },
  { key: 'today', label: '今日', icon: <Clock className="h-4 w-4" /> },
  { key: 'week', label: '今週', icon: <CalendarDays className="h-4 w-4" /> },
  { key: 'month', label: '今月', icon: <Calendar className="h-4 w-4" /> },
];

export const TimePeriodSidebar: React.FC<TimePeriodSidebarProps> = ({
  filter,
  onChange,
  taskCounts,
}) => {
  return (
    <aside className="w-36 shrink-0">
      <div className="sticky top-24 card p-3 space-y-1">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-2 pb-2">
          期間
        </h3>
        {FILTER_OPTIONS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
              filter === key
                ? 'bg-primary-cyan/20 text-primary-cyan border border-primary-cyan/30'
                : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
            }`}
          >
            <span className="shrink-0">{icon}</span>
            <span className="font-medium">{label}</span>
            <span
              className={`ml-auto text-xs px-1.5 py-0.5 rounded-full ${
                filter === key
                  ? 'bg-primary-cyan/30 text-primary-cyan'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              {taskCounts[key]}
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
};
