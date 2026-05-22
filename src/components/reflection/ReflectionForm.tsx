import React from 'react';
import { Loader2, Save, Sparkles } from 'lucide-react';
import type { WeeklyReflectionInput } from '../../types';
import { formatDate } from '../../utils/dateUtils';

interface ReflectionFormProps {
  value: WeeklyReflectionInput;
  onChange: (updates: Partial<WeeklyReflectionInput>) => void;
  onSave: () => void;
  onGenerateInsight: () => void;
  isSaving: boolean;
  isGeneratingInsight: boolean;
  lastSavedAt?: string;
}

const moodLabels: Record<WeeklyReflectionInput['mood'], string> = {
  low: '低い',
  neutral: '安定',
  high: '高い',
};

const energyLabels: Record<WeeklyReflectionInput['energy'], string> = {
  depleted: '消耗',
  balanced: 'バランス',
  charged: '充電満タン',
};

export const ReflectionForm: React.FC<ReflectionFormProps> = ({
  value,
  onChange,
  onSave,
  onGenerateInsight,
  isSaving,
  isGeneratingInsight,
  lastSavedAt,
}) => {
  const handleFieldChange = (field: keyof WeeklyReflectionInput) => (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ [field]: event.target.value });
  };

  const handleSelectChange = <K extends 'mood' | 'energy'>(field: K) => (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ [field]: event.target.value as WeeklyReflectionInput[K] });
  };

  const actionDisabled = isSaving || isGeneratingInsight;

  return (
    <section className="card card-hover p-6 space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-white">週次リフレクション</h3>
          <p className="text-sm text-[#ccc] mt-1">
            今週の勝因・課題・学びを整理し、次週へ向けたフォーカスを明確にしましょう。
          </p>
        </div>
        {lastSavedAt && (
          <div className="text-xs text-[#888]">
            最終保存: {formatDate(lastSavedAt, 'yyyy/MM/dd HH:mm')}
          </div>
        )}
      </header>

      <div className="grid md:grid-cols-2 gap-4">
        <label className="space-y-2">
          <span className="text-sm font-medium text-[#ddd] flex items-center justify-between">
            今週の勝因 <span className="text-xs text-[#666]">{value.wins.length}文字</span>
          </span>
          <textarea
            value={value.wins}
            onChange={handleFieldChange('wins')}
            rows={4}
            className="w-full rounded-lg border border-[#333] bg-[#131313]/70 px-3 py-2 text-sm text-[#f0f0f0] placeholder-[#555] focus:border-primary-cyan focus:outline-none"
            placeholder="例: 高エネルギー時間帯に優先度Sタスクを固定化できた"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-[#ddd] flex items-center justify-between">
            最大の課題 <span className="text-xs text-[#666]">{value.challenges.length}文字</span>
          </span>
          <textarea
            value={value.challenges}
            onChange={handleFieldChange('challenges')}
            rows={4}
            className="w-full rounded-lg border border-[#333] bg-[#131313]/70 px-3 py-2 text-sm text-[#f0f0f0] placeholder-[#555] focus:border-primary-cyan focus:outline-none"
            placeholder="例: SNS案件が後ろ倒しになりやすい"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-[#ddd] flex items-center justify-between">
            学び・発見 <span className="text-xs text-[#666]">{value.learnings.length}文字</span>
          </span>
          <textarea
            value={value.learnings}
            onChange={handleFieldChange('learnings')}
            rows={4}
            className="w-full rounded-lg border border-[#333] bg-[#131313]/70 px-3 py-2 text-sm text-[#f0f0f0] placeholder-[#555] focus:border-primary-cyan focus:outline-none"
            placeholder="例: 朝のインプット時間を削ると集中力が落ちる"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-[#ddd] flex items-center justify-between">
            来週のフォーカス <span className="text-xs text-[#666]">{value.focusNextWeek.length}文字</span>
          </span>
          <textarea
            value={value.focusNextWeek}
            onChange={handleFieldChange('focusNextWeek')}
            rows={4}
            className="w-full rounded-lg border border-[#333] bg-[#131313]/70 px-3 py-2 text-sm text-[#f0f0f0] placeholder-[#555] focus:border-primary-cyan focus:outline-none"
            placeholder="例: SNS優先度Sタスクを週前半に完了する"
          />
        </label>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <label className="space-y-2">
          <span className="text-sm font-medium text-[#ddd]">今週の気分</span>
          <select
            value={value.mood}
            onChange={handleSelectChange('mood')}
            className="w-full rounded-lg border border-[#333] bg-[#131313]/70 px-3 py-2 text-sm text-[#f0f0f0] focus:border-primary-cyan focus:outline-none"
          >
            {Object.entries(moodLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-[#ddd]">エネルギー残量</span>
          <select
            value={value.energy}
            onChange={handleSelectChange('energy')}
            className="w-full rounded-lg border border-[#333] bg-[#131313]/70 px-3 py-2 text-sm text-[#f0f0f0] focus:border-primary-cyan focus:outline-none"
          >
            {Object.entries(energyLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 md:col-span-1 md:mt-0 mt-4">
          <span className="text-sm font-medium text-[#ddd] flex items-center justify-between">
            メモ <span className="text-xs text-[#666]">{value.notes.length}文字</span>
          </span>
          <textarea
            value={value.notes}
            onChange={handleFieldChange('notes')}
            rows={2}
            className="w-full rounded-lg border border-[#333] bg-[#131313]/70 px-3 py-2 text-sm text-[#f0f0f0] placeholder-[#555] focus:border-primary-cyan focus:outline-none"
            placeholder="気づきや感情のメモがあれば記入"
          />
        </label>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-2">
        <div className="text-xs text-[#666]">
          保存後は履歴タブから過去の振り返りと AI 提案を参照できます。
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={actionDisabled}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary-cyan/40 bg-primary-cyan/20 px-4 py-2 text-sm font-medium text-primary-cyan hover:bg-primary-cyan/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>振り返りを保存</span>
          </button>
          <button
            type="button"
            onClick={onGenerateInsight}
            disabled={actionDisabled}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary-green/40 bg-primary-green/20 px-4 py-2 text-sm font-medium text-primary-green hover:bg-primary-green/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGeneratingInsight ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span>AIに次週提案を生成</span>
          </button>
        </div>
      </div>
    </section>
  );
};
