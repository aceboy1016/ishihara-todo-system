import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { TaskFormData, Task } from '../../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: TaskFormData) => void;
  title: string;
  editingTask?: Task; // 編集するタスク（新規作成時はundefined）
  defaultCategory?: Task['category']; // 事前選択するカテゴリー
  defaultTaskData?: Partial<TaskFormData>;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  editingTask,
  defaultCategory,
  defaultTaskData
}) => {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    category: 'note',
    priority: 'B',
    energy: 'medium',
    estimatedHours: 1,
    notes: '',
    scheduledDate: '',
    isRecurring: false,
    recurringType: 'weekly',
    recurringInterval: 1
  });

  // 編集タスクがある場合、フォームデータを設定
  useEffect(() => {
    if (editingTask) {
      setFormData({
        title: editingTask.title,
        category: editingTask.category,
        priority: editingTask.priority,
        energy: editingTask.energy,
        estimatedHours: editingTask.estimatedHours,
        notes: editingTask.notes || '',
        scheduledDate: editingTask.scheduledDate || '',
        isRecurring: editingTask.isRecurring || false,
        recurringType: editingTask.recurringType || 'weekly',
        recurringInterval: editingTask.recurringInterval || 1
      });
    } else {
      // 新規作成時はフォームをリセット
      const category = defaultCategory || 'note';
      const newFormData: TaskFormData = {
        title: '',
        category,
        priority: 'B' as const,
        energy: 'medium' as const,
        estimatedHours: 1,
        notes: '',
        scheduledDate: '',
        isRecurring: false,
        recurringType: 'weekly' as const,
        recurringInterval: 1,
        ...defaultTaskData
      };
      setFormData(newFormData);
    }
  }, [editingTask, isOpen, defaultCategory, defaultTaskData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim()) {
      onSubmit(formData);
      setFormData({
        title: '',
        category: 'note',
        priority: 'B',
        energy: 'medium',
        estimatedHours: 1,
        notes: '',
        scheduledDate: '',
        isRecurring: false,
        recurringType: 'weekly',
        recurringInterval: 1
      });
      onClose();
    }
  };

  const handleInputChange = (field: keyof TaskFormData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md mx-4 border border-slate-700">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* タイトル */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              タスクタイトル
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-cyan focus:border-transparent"
              placeholder="タスクを入力してください"
              required
            />
          </div>

          {/* カテゴリ */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              カテゴリ
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value as TaskFormData['category'])}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-cyan focus:border-transparent"
            >
              <option value="note">📝 note</option>
              <option value="standfm">🎙️ standFM</option>
              <option value="instagram">📷 Instagram</option>
              <option value="youtube">📺 YouTube</option>
              <option value="expertise">🎯 専門性開発</option>
              <option value="marketing">📈 マーケティング</option>
              <option value="business">💼 ビジネス</option>
              <option value="topform">🏢 TOPFORM</option>
              <option value="private">🏠 プライベート</option>
              <option value="other">📌 その他</option>
              <option value="reading">📚 読書</option>
            </select>
          </div>

          {/* 優先度とエネルギー */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                優先度
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value as TaskFormData['priority'])}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-cyan focus:border-transparent"
              >
                <option value="S">S (最高)</option>
                <option value="A">A (高)</option>
                <option value="B">B (標準)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                エネルギー
              </label>
              <select
                value={formData.energy}
                onChange={(e) => handleInputChange('energy', e.target.value as TaskFormData['energy'])}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-cyan focus:border-transparent"
              >
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </div>
          </div>

          {/* 予想時間 */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              予想時間（時間）
            </label>
            <input
              type="number"
              min="0.5"
              max="24"
              step="0.5"
              value={formData.estimatedHours}
              onChange={(e) => handleInputChange('estimatedHours', parseFloat(e.target.value))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-cyan focus:border-transparent"
            />
          </div>

          {/* スケジュール日付 */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              予定日（任意）
            </label>
            <input
              type="date"
              value={formData.scheduledDate}
              onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-cyan focus:border-transparent"
            />
          </div>

          {/* 繰り返し設定 */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              繰り返し
            </label>
            <select
              value={formData.isRecurring ? `${formData.recurringType}` : 'none'}
              onChange={(e) => {
                if (e.target.value === 'none') {
                  handleInputChange('isRecurring', false);
                } else {
                  handleInputChange('isRecurring', true);
                  handleInputChange('recurringType', e.target.value);
                  handleInputChange('recurringInterval', 1);
                }
              }}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-cyan focus:border-transparent"
            >
              <option value="none">📅 その日だけ</option>
              <option value="daily">🔄 毎日</option>
              <option value="weekly">📅 毎週</option>
              <option value="monthly">📆 毎月</option>
              <option value="yearly">🗓️ 毎年</option>
            </select>
          </div>

          {/* メモ */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              メモ（任意）
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-cyan focus:border-transparent resize-none"
              rows={3}
              placeholder="補足情報があれば入力してください"
            />
          </div>

          {/* ボタン */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary-cyan hover:bg-primary-cyan/80 text-white rounded-lg transition-colors font-medium"
            >
              追加
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};