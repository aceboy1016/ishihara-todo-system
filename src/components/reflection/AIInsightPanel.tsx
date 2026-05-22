import React from 'react';
import { Brain, RefreshCcw, ShieldAlert } from 'lucide-react';
import type { AIInsight } from '../../types';
import { formatDate } from '../../utils/dateUtils';

interface AIInsightPanelProps {
  insight?: AIInsight;
  error?: string | null;
  onRegenerate: () => void;
  isGenerating: boolean;
}

export const AIInsightPanel: React.FC<AIInsightPanelProps> = ({ insight, error, onRegenerate, isGenerating }) => {
  if (!insight && !error) {
    return (
      <section className="card card-hover p-6">
        <div className="flex items-center gap-3 text-[#ccc]">
          <Brain className="h-6 w-6 text-primary-green" />
          <div>
            <h3 className="text-lg font-semibold text-white">AI 提案を待っています</h3>
            <p className="text-sm text-[#888]">振り返りを保存してから AI 提案を生成することで、次週のフォーカスが明確になります。</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card card-hover border border-red-500/40 p-6 bg-red-500/10">
        <div className="flex items-start gap-3 text-red-200">
          <ShieldAlert className="h-5 w-5 mt-1" />
          <div className="space-y-2">
            <div>
              <h3 className="text-lg font-semibold text-white">AI 提案の生成に失敗しました</h3>
              <p className="text-sm">{error}</p>
            </div>
            <button
              onClick={onRegenerate}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 rounded-lg border border-red-400/60 bg-red-400/20 px-3 py-1.5 text-sm font-medium text-red-200 hover:bg-red-400/30 disabled:opacity-60"
            >
              <RefreshCcw className="h-4 w-4" />
              再試行する
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!insight) return null;

  return (
    <section className="card card-hover p-6 space-y-4">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-white">AI 提案</h3>
          <p className="text-sm text-[#ccc] mt-1">週次のログを解析し、次週に向けたフォーカスと改善案を提案します。</p>
        </div>
        <div className="text-xs text-[#666] space-y-1 text-right">
          <div>生成: {formatDate(insight.generatedAt, 'yyyy/MM/dd HH:mm')}</div>
          <div className="uppercase tracking-wide text-[#888]">Engine: {insight.engine}</div>
        </div>
      </header>

      <div className="bg-[#0d0d0d]/40 border border-[#2a2a2a] rounded-xl p-5 space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-primary-cyan uppercase tracking-wide">Summary</h4>
          <p className="mt-1 text-sm text-[#ddd] leading-relaxed">{insight.summary}</p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-primary-green uppercase tracking-wide flex items-center gap-2">
            Focus Areas
            <span className="text-xs text-[#888]">{insight.focusAreas.length}件</span>
          </h4>
          <ul className="mt-2 space-y-2 text-sm text-[#ddd]">
            {insight.focusAreas.map((item, index) => (
              <li key={index} className="rounded-lg border border-[#2a2a2a] bg-[#131313]/60 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-primary-green uppercase tracking-wide flex items-center gap-2">
            Recommendations
            <span className="text-xs text-[#888]">{insight.recommendations.length}件</span>
          </h4>
          <ul className="mt-2 space-y-2 text-sm text-[#ddd]">
            {insight.recommendations.map((item, index) => (
              <li key={index} className="rounded-lg border border-[#2a2a2a] bg-[#131313]/60 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-[#2a2a2a] bg-[#131313]/50 p-4">
            <h4 className="text-sm font-semibold text-primary-cyan uppercase tracking-wide">Encouragement</h4>
            <p className="mt-2 text-sm text-[#ddd] leading-relaxed">{insight.encouragement}</p>
          </div>
          <div className="rounded-lg border border-[#2a2a2a] bg-[#131313]/50 p-4">
            <h4 className="text-sm font-semibold text-primary-cyan uppercase tracking-wide">Energy Advice</h4>
            <p className="mt-2 text-sm text-[#ddd] leading-relaxed">{insight.energyAdvice}</p>
          </div>
        </div>
      </div>

      <footer className="flex items-center justify-between pt-2 text-xs text-[#888]">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary-green" />
          <span>AI提案をもとに次週のタスクを再構成し、振り返りと学びをループさせましょう。</span>
        </div>
      </footer>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onRegenerate}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 rounded-lg border border-primary-green/40 bg-primary-green/20 px-4 py-2 text-sm font-medium text-primary-green hover:bg-primary-green/30 disabled:opacity-60"
        >
          <RefreshCcw className="h-4 w-4" />
          再生成する
        </button>
      </div>
    </section>
  );
};
