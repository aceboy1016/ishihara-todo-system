import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Target, Calendar, TrendingUp, CheckCircle2, Circle } from 'lucide-react';
import type { LongTermGoals, LongTermPhase } from '../../types';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { INITIAL_LONG_TERM_GOALS } from '../../constants/longTermGoals';
import clsx from 'clsx';

export const LongTermGoalsPanel: React.FC = () => {
  const [goals, setGoals] = useLocalStorage<LongTermGoals>('ishihara-long-term-goals', INITIAL_LONG_TERM_GOALS);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(['phase-1']));

  const togglePhase = (phaseId: string) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId);
    } else {
      newExpanded.add(phaseId);
    }
    setExpandedPhases(newExpanded);
  };

  const toggleGoalAchievement = (phaseId: string, goalId: string) => {
    if (!goals) return;

    const updatedGoals = {
      ...goals,
      phases: goals.phases.map(phase =>
        phase.id === phaseId
          ? {
              ...phase,
              goals: phase.goals.map(goal =>
                goal.id === goalId
                  ? { ...goal, isAchieved: !goal.isAchieved }
                  : goal
              )
            }
          : phase
      ),
      lastUpdated: new Date().toISOString()
    };

    setGoals(updatedGoals);
  };

  const getPhaseProgress = (phase: LongTermPhase) => {
    const achieved = phase.goals.filter(goal => goal.isAchieved).length;
    return Math.round((achieved / phase.goals.length) * 100);
  };

  const getPhaseColorClasses = (phase: LongTermPhase) => {
    if (phase.currentPhase) {
      return {
        gradient: 'from-cyan-500/20 to-blue-600/20',
        border: 'border-cyan-500/30',
        accent: 'text-cyan-400',
        progress: 'bg-gradient-to-r from-cyan-500 to-blue-600'
      };
    }

    const progress = getPhaseProgress(phase);
    if (progress === 100) {
      return {
        gradient: 'from-emerald-500/20 to-green-600/20',
        border: 'border-emerald-500/30',
        accent: 'text-emerald-400',
        progress: 'bg-gradient-to-r from-emerald-500 to-green-600'
      };
    }

    return {
      gradient: 'from-slate-500/20 to-gray-600/20',
      border: 'border-[#3e3e3e]/30',
      accent: 'text-[#888]',
      progress: 'bg-gradient-to-r from-slate-500 to-gray-600'
    };
  };

  if (!goals) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Target className="h-6 w-6 text-cyan-400" />
        <h2 className="text-2xl font-bold text-white">長期目標</h2>
        <div className="text-sm text-[#888]">
          戦略的ロードマップ 2025-2030
        </div>
      </div>

      <div className="space-y-4">
        {goals.phases.map((phase) => {
          const isExpanded = expandedPhases.has(phase.id);
          const progress = getPhaseProgress(phase);
          const colorClasses = getPhaseColorClasses(phase);

          return (
            <div
              key={phase.id}
              className={clsx(
                'card',
                'bg-gradient-to-br', colorClasses.gradient,
                'border', colorClasses.border,
                'transition-all duration-200',
                phase.currentPhase && 'ring-1 ring-cyan-400/30'
              )}
            >
              {/* Phase Header */}
              <div className="p-4 border-b border-[#2a2a2a]">
                <button
                  onClick={() => togglePhase(phase.id)}
                  className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-[#888]" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-[#888]" />
                      )}
                      {phase.currentPhase && (
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      )}
                    </div>
                    <div className="text-left">
                      <h3 className={clsx('text-lg font-bold', colorClasses.accent)}>
                        {phase.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-xs text-[#888]">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{phase.period}</span>
                        </div>
                        {phase.currentPhase && (
                          <span className="px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                            現在のフェーズ
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Progress Circle */}
                    <div className="relative w-12 h-12">
                      <svg className="w-12 h-12 transform -rotate-90">
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="transparent"
                          className="text-[#555]"
                        />
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="transparent"
                          strokeDasharray={`${2 * Math.PI * 20}`}
                          strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress / 100)}`}
                          className={clsx('transition-all duration-500 ease-out', colorClasses.accent)}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={clsx('text-xs font-bold', colorClasses.accent)}>
                          {progress}%
                        </span>
                      </div>
                    </div>

                    <TrendingUp className={clsx('h-5 w-5', colorClasses.accent)} />
                  </div>
                </button>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="w-full bg-[#1a1a1a] rounded-full h-2">
                    <div
                      className={clsx(
                        'h-full rounded-full transition-all duration-1000 ease-out',
                        colorClasses.progress
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Phase Description */}
                <p className="text-sm text-[#ccc] mt-3">
                  {phase.description}
                </p>
              </div>

              {/* Goals List */}
              {isExpanded && (
                <div className="p-4 space-y-3">
                  {phase.goals.map((goal) => (
                    <div
                      key={goal.id}
                      className="flex items-start space-x-3 p-3 bg-[#0d0d0d] border border-[#232323] rounded-lg"
                    >
                      <button
                        onClick={() => toggleGoalAchievement(phase.id, goal.id)}
                        className={clsx(
                          'flex-shrink-0 w-5 h-5 rounded border-2 transition-all duration-200',
                          'flex items-center justify-center mt-0.5',
                          goal.isAchieved
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-[#444] hover:border-emerald-400 hover:bg-emerald-400/10'
                        )}
                      >
                        {goal.isAchieved ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <Circle className="h-3 w-3" />
                        )}
                      </button>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className={clsx(
                            'font-medium text-sm',
                            goal.isAchieved
                              ? 'text-emerald-400 line-through'
                              : 'text-white'
                          )}>
                            {goal.title}
                          </h4>
                          {goal.target && (
                            <span className={clsx(
                              'text-xs px-2 py-1 rounded-full border',
                              colorClasses.accent,
                              colorClasses.border,
                              'bg-[#131313]/50'
                            )}>
                              {goal.target}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#888] mt-1">
                          {goal.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-xs text-[#666] text-center">
        最終更新: {new Date(goals.lastUpdated).toLocaleString('ja-JP')}
      </div>
    </div>
  );
};