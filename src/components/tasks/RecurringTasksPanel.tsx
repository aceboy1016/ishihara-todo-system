import React, { useMemo } from 'react';
import { Repeat, Edit2, Trash2 } from 'lucide-react';
import type { Task } from '../../types';
import clsx from 'clsx';

interface RecurringTasksPanelProps {
  tasks: Task[];
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (taskId: number) => void;
}

const categoryConfig: Record<string, { icon: string; name: string }> = {
  note: { icon: '📝', name: 'note' },
  standfm: { icon: '🎙️', name: 'standFM' },
  instagram: { icon: '📷', name: 'Instagram' },
  youtube: { icon: '📺', name: 'YouTube' },
  expertise: { icon: '🎯', name: '専門性開発' },
  marketing: { icon: '📈', name: 'マーケティング' },
  business: { icon: '💼', name: 'ビジネス' },
  topform: { icon: '🏢', name: 'TOPFORM' },
  private: { icon: '🏠', name: 'プライベート' },
  other: { icon: '📌', name: 'その他' },
  reading: { icon: '📚', name: '読書' }
};

export const RecurringTasksPanel: React.FC<RecurringTasksPanelProps> = ({
  tasks,
  onTaskEdit,
  onTaskDelete
}) => {
  const recurringTasks = useMemo(() => {
    return tasks.filter(task => task.isRecurring);
  }, [tasks]);

  const recurringTypeLabel = (type?: string) => {
    switch (type) {
      case 'daily': return '毎日';
      case 'weekly': return '毎週';
      case 'monthly': return '毎月';
      case 'yearly': return '毎年';
      default: return '-';
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Repeat className="h-5 w-5 text-purple-400" />
        <h3 className="text-lg font-bold text-white">繰り返しタスク一覧</h3>
        <span className="text-sm text-[#888]">({recurringTasks.length}件)</span>
      </div>

      {recurringTasks.length === 0 ? (
        <div className="text-center py-12">
          <Repeat className="h-12 w-12 text-[#555] mx-auto mb-4" />
          <p className="text-[#888]">繰り返しタスクはありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recurringTasks.map(task => {
            const config = categoryConfig[task.category];
            return (
              <div
                key={task.id}
                className="p-4 bg-[#1e1e1e]/30 border border-[#2e2e2e] rounded-lg hover:bg-[#1a1a1a] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">{config.icon}</span>
                      <h4 className="text-white font-medium">{task.title}</h4>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {/* カテゴリ */}
                      <span className="px-2 py-1 bg-[#252525]/50 text-[#ccc] rounded">
                        {config.name}
                      </span>

                      {/* 繰り返し種類 */}
                      <span className="inline-flex items-center px-2 py-1 rounded bg-purple-500/10 border border-purple-500/30 text-purple-400">
                        <Repeat className="h-3 w-3 mr-1" />
                        {recurringTypeLabel(task.recurringType)}
                        {task.recurringInterval && task.recurringInterval > 1 && (
                          <span className="ml-1">({task.recurringInterval})</span>
                        )}
                      </span>

                      {/* 優先度 */}
                      <span className={clsx(
                        'px-2 py-1 rounded',
                        task.priority === 'S' && 'bg-red-500/10 border border-red-500/30 text-red-400',
                        task.priority === 'A' && 'bg-orange-500/10 border border-orange-500/30 text-orange-400',
                        task.priority === 'B' && 'bg-green-500/10 border border-green-500/30 text-green-400'
                      )}>
                        {task.priority}優先
                      </span>

                      {/* 基準日 */}
                      {task.scheduledDate && (
                        <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded">
                          基準日: {task.scheduledDate}
                        </span>
                      )}
                    </div>

                    {task.notes && (
                      <p className="text-xs text-[#888] mt-2">{task.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => onTaskEdit(task)}
                      className="p-2 hover:bg-[#252525] rounded-lg transition-colors text-[#888] hover:text-primary-cyan"
                      title="編集"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`「${task.title}」を削除しますか？`)) {
                          onTaskDelete(task.id);
                        }
                      }}
                      className="p-2 hover:bg-[#252525] rounded-lg transition-colors text-[#888] hover:text-red-400"
                      title="削除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
