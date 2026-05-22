import React, { useState } from 'react';
import { Edit3, Save, X, TrendingUp, Users } from 'lucide-react';
import type { CategoryGoals } from '../../types';
import { useSNSGoals } from '../../hooks/useSNSGoals';
import clsx from 'clsx';

interface SNSGoalsEditorProps {
  // Props are optional since we'll use the hook internally
}

interface PlatformData {
  key: keyof CategoryGoals;
  name: string;
  icon: string;
  color: string;
}

const platforms: PlatformData[] = [
  { key: 'note', name: 'note', icon: '📝', color: 'text-teal-400' },
  { key: 'standfm', name: 'standFM', icon: '🎙️', color: 'text-orange-400' },
  { key: 'instagram', name: 'Instagram', icon: '📷', color: 'text-pink-400' },
  { key: 'youtube', name: 'YouTube', icon: '📺', color: 'text-red-400' }
];

export const SNSGoalsEditor: React.FC<SNSGoalsEditorProps> = () => {
  const { goals, updateGoals, getWeeklyGrowth, getLastUpdateInfo } = useSNSGoals();
  const [isEditing, setIsEditing] = useState(false);
  const [editingGoals, setEditingGoals] = useState<CategoryGoals>(goals);

  const handleEdit = () => {
    setEditingGoals(goals);
    setIsEditing(true);
  };

  const handleSave = () => {
    updateGoals(editingGoals);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditingGoals(goals);
    setIsEditing(false);
  };

  const handleCurrentChange = (platform: keyof CategoryGoals, value: number) => {
    setEditingGoals(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        current: value
      }
    }));
  };

  const handleTargetChange = (platform: keyof CategoryGoals, value: number) => {
    setEditingGoals(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        target: value
      }
    }));
  };

  const getProgress = (current: number | string, target: number | string) => {
    const currentNum = typeof current === 'number' ? current : 0;
    const targetNum = typeof target === 'number' ? target : 1;
    return Math.min(Math.round((currentNum / targetNum) * 100), 100);
  };

  const lastUpdateInfo = getLastUpdateInfo();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="h-6 w-6 text-cyan-400" />
          <h3 className="text-xl font-bold text-white">SNS フォロワー目標</h3>
          <div className="text-sm text-[#888]">
            {lastUpdateInfo
              ? `最終更新: ${lastUpdateInfo.year}年第${lastUpdateInfo.weekNumber}週 (${lastUpdateInfo.date})`
              : '週次更新'
            }
          </div>
        </div>

        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 transition-colors"
          >
            <Edit3 className="h-4 w-4" />
            <span>編集</span>
          </button>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>保存</span>
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30 transition-colors"
            >
              <X className="h-4 w-4" />
              <span>キャンセル</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {platforms.map((platform) => {
          const goalData = isEditing ? editingGoals[platform.key] : goals[platform.key];
          const currentValue = typeof goalData.current === 'number' ? goalData.current : 0;
          const targetValue = typeof goalData.target === 'number' ? goalData.target : 0;
          const progress = getProgress(currentValue, targetValue);
          const growth = getWeeklyGrowth(platform.key);

          return (
            <div
              key={platform.key}
              className="p-4 bg-[#131313]/50 border border-[#2a2a2a] rounded-lg hover:bg-[#131313]/70 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{platform.icon}</span>
                  <h4 className={clsx('font-semibold', platform.color)}>
                    {platform.name}
                  </h4>
                </div>
                {!isEditing && (
                  <div className={clsx(
                    'flex items-center space-x-1 text-xs px-2 py-1 rounded-full',
                    growth >= 0
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  )}>
                    <TrendingUp className={clsx('h-3 w-3', growth < 0 && 'rotate-180')} />
                    <span>{growth >= 0 ? '+' : ''}{growth}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {/* Current Value */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#888]">現在</span>
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      value={currentValue}
                      onChange={(e) => handleCurrentChange(platform.key, parseInt(e.target.value) || 0)}
                      className="w-20 px-2 py-1 text-sm bg-[#1e1e1e] border border-[#333] rounded text-white focus:border-blue-400 focus:outline-none"
                    />
                  ) : (
                    <span className="text-white font-semibold">{currentValue}</span>
                  )}
                </div>

                {/* Target Value */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#888]">目標</span>
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      value={targetValue}
                      onChange={(e) => handleTargetChange(platform.key, parseInt(e.target.value) || 0)}
                      className="w-20 px-2 py-1 text-sm bg-[#1e1e1e] border border-[#333] rounded text-white focus:border-blue-400 focus:outline-none"
                    />
                  ) : (
                    <span className="text-white font-semibold">{targetValue}</span>
                  )}
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#888]">進捗</span>
                    <span className={clsx('text-sm font-semibold', platform.color)}>
                      {progress}%
                    </span>
                  </div>
                  <div className="w-full bg-[#1e1e1e] rounded-full h-2">
                    <div
                      className={clsx(
                        'h-full rounded-full transition-all duration-500',
                        platform.key === 'note' && 'bg-gradient-to-r from-teal-500 to-cyan-600',
                        platform.key === 'standfm' && 'bg-gradient-to-r from-orange-500 to-red-600',
                        platform.key === 'instagram' && 'bg-gradient-to-r from-pink-500 to-rose-600',
                        platform.key === 'youtube' && 'bg-gradient-to-r from-red-500 to-rose-600'
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Remaining to Goal */}
                {!isEditing && (
                  <div className="text-xs text-[#666]">
                    目標まで残り: {Math.max(0, targetValue - currentValue)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isEditing && (
        <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="text-blue-400 mt-1">
              <Edit3 className="h-4 w-4" />
            </div>
            <div className="text-sm text-blue-200">
              <p className="font-medium mb-1">週次更新のコツ</p>
              <ul className="space-y-1 text-blue-300/80">
                <li>• 現在の数値を正確に入力してください</li>
                <li>• 目標は達成可能な範囲で設定しましょう</li>
                <li>• 毎週同じ曜日に更新することを推奨します</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};