import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Edit2, Trash2 } from 'lucide-react';
import type { CustomCategory } from '../../hooks/useCustomCategories';

const COLOR_OPTIONS = [
  '#41C9B4', '#FF6B35', '#E4405F', '#FF0000', '#4ecdc4',
  '#45b7d1', '#f9ca24', '#e74c3c', '#9b59b6', '#7f8c8d',
  '#6c5ce7', '#00b8ff', '#00ff88', '#fd79a8', '#fdcb6e',
  '#e17055', '#74b9ff', '#a29bfe', '#55efc4', '#ffeaa7',
];

const ICON_OPTIONS = [
  '📝', '🎙️', '📷', '📺', '🎯', '📈', '💼', '🏢', '🏠', '📌',
  '📚', '⭐', '🔥', '💡', '🚀', '🎨', '🏃', '💰', '🎪', '🌟',
  '✅', '⚡', '🎵', '🌈', '🏆', '🎭', '📊', '🔑', '💎', '🌸',
];

const DEFAULT_CATEGORIES = [
  { id: 'note', name: 'note', icon: '📝' },
  { id: 'standfm', name: 'standFM', icon: '🎙️' },
  { id: 'instagram', name: 'Instagram', icon: '📷' },
  { id: 'youtube', name: 'YouTube', icon: '📺' },
  { id: 'expertise', name: '専門性開発', icon: '🎯' },
  { id: 'marketing', name: 'マーケティング', icon: '📈' },
  { id: 'business', name: 'ビジネス', icon: '💼' },
  { id: 'topform', name: 'TOPFORM', icon: '🏢' },
  { id: 'private', name: 'プライベート', icon: '🏠' },
  { id: 'other', name: 'その他', icon: '📌' },
  { id: 'reading', name: '読書', icon: '📚' },
];

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customCategories: CustomCategory[];
  onAdd: (category: Omit<CustomCategory, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<CustomCategory>) => void;
  onDelete: (id: string) => void;
}

type Mode = 'list' | 'add' | 'edit';

const emptyForm = { name: '', icon: '📌', color: '#41C9B4' };

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  customCategories,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const [mode, setMode] = useState<Mode>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setMode('list');
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    if (mode === 'add') {
      onAdd({ name: form.name.trim(), icon: form.icon, color: form.color });
    } else if (mode === 'edit' && editingId) {
      onUpdate(editingId, { name: form.name.trim(), icon: form.icon, color: form.color });
    }
    resetForm();
  };

  const handleEdit = (cat: CustomCategory) => {
    setForm({ name: cat.name, icon: cat.icon, color: cat.color });
    setEditingId(cat.id);
    setMode('edit');
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/50  flex items-center justify-center z-[9999]">
      <div className="bg-[#f9fafb] rounded-xl shadow-2xl w-full max-w-lg mx-4 border border-[#e5e7eb] max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-[#e5e7eb] shrink-0">
          <h2 className="text-xl font-bold text-[#111827]">カテゴリー管理</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#f3f4f6] rounded-lg transition-colors text-[#6b7280] hover:text-[#111827]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Default categories (read-only) */}
          <div>
            <h3 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-3">
              デフォルトカテゴリー
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {DEFAULT_CATEGORIES.map(cat => (
                <div
                  key={cat.id}
                  className="flex items-center gap-2 bg-[#f3f4f6] rounded-lg px-3 py-2 text-sm text-[#374151]"
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Custom categories */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide">
                カスタムカテゴリー
              </h3>
              {mode === 'list' && (
                <button
                  onClick={() => setMode('add')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-primary-cyan/20 text-primary-cyan rounded-lg text-sm hover:bg-primary-cyan/30 transition-colors border border-primary-cyan/30"
                >
                  <Plus className="h-3.5 w-3.5" />
                  追加
                </button>
              )}
            </div>

            {/* Add / Edit Form */}
            {(mode === 'add' || mode === 'edit') && (
              <div className="bg-[#f3f4f6] rounded-xl p-4 space-y-4 mb-4 border border-[#d1d5db]">
                <h4 className="text-sm font-medium text-[#111827]">
                  {mode === 'add' ? '新しいカテゴリー' : 'カテゴリーを編集'}
                </h4>

                <div>
                  <label className="block text-xs text-[#6b7280] mb-1">名前</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="カテゴリー名"
                    className="w-full px-3 py-2 bg-[#f3f4f6] border border-[#d1d5db] rounded-lg text-[#111827] text-sm focus:outline-none focus:ring-2 focus:ring-primary-cyan"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#6b7280] mb-2">アイコン</label>
                  <div className="flex flex-wrap gap-2">
                    {ICON_OPTIONS.map(icon => (
                      <button
                        key={icon}
                        onClick={() => setForm(f => ({ ...f, icon }))}
                        className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                          form.icon === icon
                            ? 'bg-primary-cyan/30 ring-2 ring-primary-cyan'
                            : 'bg-[#f3f4f6] hover:bg-[#e5e7eb]'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-[#6b7280] mb-2">カラー</label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map(color => (
                      <button
                        key={color}
                        onClick={() => setForm(f => ({ ...f, color }))}
                        className={`w-7 h-7 rounded-full transition-all ${
                          form.color === color
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110'
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  {/* Preview */}
                  <div className="mt-2 flex items-center gap-2 text-sm text-[#374151]">
                    <span className="text-base">{form.icon}</span>
                    <span style={{ color: form.color }}>{form.name || 'カテゴリー名'}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={resetForm}
                    className="flex-1 px-4 py-2 border border-[#d1d5db] rounded-lg text-[#374151] hover:bg-[#f3f4f6] text-sm transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!form.name.trim()}
                    className="flex-1 px-4 py-2 bg-primary-cyan hover:bg-primary-cyan/80 text-[#111827] rounded-lg text-sm transition-colors disabled:opacity-40"
                  >
                    {mode === 'add' ? '追加' : '保存'}
                  </button>
                </div>
              </div>
            )}

            {customCategories.length === 0 && mode === 'list' ? (
              <p className="text-sm text-[#9ca3af] py-4 text-center">
                カスタムカテゴリーはまだありません
              </p>
            ) : (
              <div className="space-y-2">
                {customCategories.map(cat => (
                  <div
                    key={cat.id}
                    className="flex items-center gap-3 bg-[#f3f4f6] rounded-lg px-3 py-2.5"
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-sm text-[#111827] font-medium flex-1">{cat.name}</span>
                    <div
                      className="w-4 h-4 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(cat)}
                        className="p-1.5 hover:bg-[#e5e7eb] rounded-lg text-[#6b7280] hover:text-[#111827] transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(cat.id)}
                        className="p-1.5 hover:bg-red-500/20 rounded-lg text-[#6b7280] hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
