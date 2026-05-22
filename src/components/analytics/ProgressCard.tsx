import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import clsx from 'clsx';

interface ProgressCardProps {
  title: string;
  current: number;
  target: number;
  unit?: string;
  trend?: number;
  color?: 'cyan' | 'green' | 'pink' | 'blue' | 'yellow' | 'orange' | 'teal' | 'red' | 'gray';
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
  title,
  current,
  target,
  unit = '',
  trend,
  color = 'cyan'
}) => {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;

  const formatValue = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  const getTrendIcon = () => {
    if (!trend) return <Minus className="h-3 w-3" />;
    if (trend > 0) return <TrendingUp className="h-3 w-3" />;
    return <TrendingDown className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (!trend) return 'text-[#888]';
    if (trend > 0) return 'text-emerald-400';
    return 'text-red-400';
  };

  const getColorClasses = () => {
    switch (color) {
      case 'cyan':
        return {
          gradient: 'from-cyan-500/20 to-blue-600/20',
          border: 'border-cyan-500/30',
          progress: 'bg-gradient-to-r from-cyan-500 to-blue-600',
          text: 'text-cyan-400'
        };
      case 'green':
        return {
          gradient: 'from-emerald-500/20 to-green-600/20',
          border: 'border-emerald-500/30',
          progress: 'bg-gradient-to-r from-emerald-500 to-green-600',
          text: 'text-emerald-400'
        };
      case 'pink':
        return {
          gradient: 'from-pink-500/20 to-rose-600/20',
          border: 'border-pink-500/30',
          progress: 'bg-gradient-to-r from-pink-500 to-rose-600',
          text: 'text-pink-400'
        };
      case 'blue':
        return {
          gradient: 'from-blue-500/20 to-indigo-600/20',
          border: 'border-blue-500/30',
          progress: 'bg-gradient-to-r from-blue-500 to-indigo-600',
          text: 'text-blue-400'
        };
      case 'yellow':
        return {
          gradient: 'from-yellow-500/20 to-orange-600/20',
          border: 'border-yellow-500/30',
          progress: 'bg-gradient-to-r from-yellow-500 to-orange-600',
          text: 'text-yellow-400'
        };
      case 'orange':
        return {
          gradient: 'from-orange-500/20 to-red-600/20',
          border: 'border-orange-500/30',
          progress: 'bg-gradient-to-r from-orange-500 to-red-600',
          text: 'text-orange-400'
        };
      case 'teal':
        return {
          gradient: 'from-teal-500/20 to-cyan-600/20',
          border: 'border-teal-500/30',
          progress: 'bg-gradient-to-r from-teal-500 to-cyan-600',
          text: 'text-teal-400'
        };
      case 'red':
        return {
          gradient: 'from-red-500/20 to-rose-600/20',
          border: 'border-red-500/30',
          progress: 'bg-gradient-to-r from-red-500 to-rose-600',
          text: 'text-red-400'
        };
      case 'gray':
        return {
          gradient: 'from-gray-500/20 to-slate-600/20',
          border: 'border-gray-500/30',
          progress: 'bg-gradient-to-r from-gray-500 to-slate-600',
          text: 'text-gray-400'
        };
      default:
        return {
          gradient: 'from-cyan-500/20 to-blue-600/20',
          border: 'border-cyan-500/30',
          progress: 'bg-gradient-to-r from-cyan-500 to-blue-600',
          text: 'text-cyan-400'
        };
    }
  };

  const colorClasses = getColorClasses();

  return (
    <div className={clsx(
      'card card-hover p-6',
      'bg-gradient-to-br', colorClasses.gradient,
      'border', colorClasses.border
    )}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-[#ccc]">
            {title}
          </h3>
          {trend !== undefined && (
            <div className={clsx(
              'flex items-center space-x-1 text-xs font-medium',
              getTrendColor()
            )}>
              {getTrendIcon()}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>

        {/* Values */}
        <div className="space-y-2">
          <div className="flex items-baseline space-x-2">
            <span className={clsx('text-3xl font-bold', colorClasses.text)}>
              {formatValue(current)}
            </span>
            {unit && (
              <span className="text-sm text-[#888]">
                {unit}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2 text-xs text-[#888]">
            <span>目標: {formatValue(target)}{unit}</span>
            <span>•</span>
            <span className={clsx(
              'font-medium',
              percentage >= 100 ? 'text-emerald-400' :
              percentage >= 75 ? colorClasses.text : 'text-[#ccc]'
            )}>
              {percentage.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-[#1a1a1a] rounded-full h-2">
            <div
              className={clsx(
                'h-full rounded-full transition-all duration-1000 ease-out',
                colorClasses.progress
              )}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};