import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Calendar, Clock, Zap } from 'lucide-react';
import type { Task } from '../../types';
import clsx from 'clsx';

interface TaskSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskSelect: (task: Task, selectedDate: Date) => void;
  tasks: Task[];
  selectedDate: Date;
}

const categoryConfig = {
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

const CATEGORY_STORAGE_KEY = 'taskSelectModal_lastCategory';

export const TaskSelectModal: React.FC<TaskSelectModalProps> = ({
  isOpen,
  onClose,
  onTaskSelect,
  tasks,
  selectedDate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  // 最後に選択したカテゴリを記憶、デフォルトはTOPFORM
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    return localStorage.getItem(CATEGORY_STORAGE_KEY) || 'topform';
  });

  // 日付が設定されていないか、今回設定する日付と異なるタスクのみを表示
  const availableTasks = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const selectedDateString = `${year}-${month}-${day}`;

    return tasks.filter(task => {
      // 既に同じ日付に設定されているタスクは除外
      if (task.scheduledDate === selectedDateString) {
        return false;
      }

      // 完了済みタスクは除外
      if (task.completed) {
        return false;
      }

      // 検索フィルター
      if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // カテゴリフィルター
      if (selectedCategory !== 'all' && task.category !== selectedCategory) {
        return false;
      }

      return true;
    });
  }, [tasks, selectedDate, searchTerm, selectedCategory]);

  // カテゴリ変更時にlocalStorageに保存
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    localStorage.setItem(CATEGORY_STORAGE_KEY, category);
  };

  const handleTaskClick = (task: Task) => {
    onTaskSelect(task, selectedDate);
    setSearchTerm('');
    // カテゴリはリセットせず、次回も同じカテゴリを維持
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl mx-4 border border-slate-700 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-primary-cyan" />
            <h2 className="text-xl font-bold text-white">
              {selectedDate.getMonth() + 1}/{selectedDate.getDate()}にタスクを追加
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 検索とフィルター */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="space-y-4">
            {/* 検索バー */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="タスクを検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-cyan focus:border-transparent"
              />
            </div>

            {/* カテゴリフィルター */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleCategoryChange('all')}
                className={clsx(
                  'px-3 py-1 rounded-full text-xs transition-colors',
                  selectedCategory === 'all'
                    ? 'bg-primary-cyan text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                )}
              >
                すべて
              </button>
              {Object.entries(categoryConfig).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => handleCategoryChange(key)}
                  className={clsx(
                    'px-3 py-1 rounded-full text-xs transition-colors flex items-center space-x-1',
                    selectedCategory === key
                      ? 'bg-primary-cyan text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  )}
                >
                  <span>{config.icon}</span>
                  <span>{config.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* タスクリスト */}
        <div className="flex-1 overflow-y-auto p-6">
          {availableTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📋</div>
              <p className="text-slate-400 mb-2">利用可能なタスクがありません</p>
              <p className="text-xs text-slate-500">
                未完了で、この日付に設定されていないタスクが表示されます
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableTasks.map(task => {
                const config = (categoryConfig as Record<string, { icon: string; name: string }>)[task.category] ?? { icon: '📌', name: task.category };
                return (
                  <div
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    className="p-4 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/30 hover:border-slate-500 rounded-lg cursor-pointer transition-all group"
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-lg flex-shrink-0">{config.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium group-hover:text-primary-cyan transition-colors">
                          {task.title}
                        </h4>
                        <div className="flex items-center space-x-3 mt-2 text-xs text-slate-400">
                          <div className="flex items-center space-x-1">
                            <div className={`
                              w-2 h-2 rounded-full
                              ${task.priority === 'S' ? 'bg-red-400' :
                                task.priority === 'A' ? 'bg-orange-400' : 'bg-green-400'}
                            `} />
                            <span>{task.priority}優先</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{task.estimatedHours}時間</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Zap className="h-3 w-3" />
                            <span>
                              {task.energy === 'high' ? '高' :
                               task.energy === 'medium' ? '中' : '低'}エネルギー
                            </span>
                          </div>
                          {task.scheduledDate && (
                            <div className="text-orange-400">
                              現在: {task.scheduledDate}
                            </div>
                          )}
                        </div>
                        {task.notes && (
                          <p className="text-xs text-slate-500 mt-1 truncate">
                            {task.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="p-6 border-t border-slate-700/50">
          <div className="text-center">
            <p className="text-xs text-slate-400">
              💡 タスクをクリックすると、{selectedDate.getMonth() + 1}/{selectedDate.getDate()}の予定に設定されます
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};