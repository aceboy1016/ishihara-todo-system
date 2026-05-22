import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import clsx from 'clsx';

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  color?: 'green' | 'blue' | 'orange' | 'purple' | 'cyan';
  icon?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  color = 'blue',
  icon,
  size = 'md'
}) => {
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
      case 'green':
        return {
          gradient: 'from-emerald-500/10 to-green-600/10',
          border: 'border-emerald-500/20',
          accent: 'text-emerald-400',
          glow: 'hover:shadow-emerald-500/20'
        };
      case 'blue':
        return {
          gradient: 'from-blue-500/10 to-indigo-600/10',
          border: 'border-blue-500/20',
          accent: 'text-blue-400',
          glow: 'hover:shadow-blue-500/20'
        };
      case 'orange':
        return {
          gradient: 'from-orange-500/10 to-red-600/10',
          border: 'border-orange-500/20',
          accent: 'text-orange-400',
          glow: 'hover:shadow-orange-500/20'
        };
      case 'purple':
        return {
          gradient: 'from-purple-500/10 to-pink-600/10',
          border: 'border-purple-500/20',
          accent: 'text-purple-400',
          glow: 'hover:shadow-purple-500/20'
        };
      case 'cyan':
        return {
          gradient: 'from-cyan-500/10 to-blue-600/10',
          border: 'border-cyan-500/20',
          accent: 'text-cyan-400',
          glow: 'hover:shadow-cyan-500/20'
        };
      default:
        return {
          gradient: 'from-blue-500/10 to-indigo-600/10',
          border: 'border-blue-500/20',
          accent: 'text-blue-400',
          glow: 'hover:shadow-blue-500/20'
        };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'p-4',
          icon: 'text-lg',
          value: 'text-xl',
          title: 'text-xs',
          subtitle: 'text-xs'
        };
      case 'lg':
        return {
          container: 'p-8',
          icon: 'text-3xl',
          value: 'text-4xl',
          title: 'text-base',
          subtitle: 'text-sm'
        };
      default:
        return {
          container: 'p-6',
          icon: 'text-2xl',
          value: 'text-3xl',
          title: 'text-sm',
          subtitle: 'text-xs'
        };
    }
  };

  const colorClasses = getColorClasses();
  const sizeClasses = getSizeClasses();

  return (
    <div className={clsx(
      'card transition-all duration-300',
      'bg-gradient-to-br', colorClasses.gradient,
      'border', colorClasses.border,
      'hover:shadow-2xl', colorClasses.glow,
      'hover:scale-105',
      sizeClasses.container
    )}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className={clsx(
              'font-medium text-[#ccc]',
              sizeClasses.title
            )}>
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

          {icon && (
            <div className={clsx(
              'opacity-60',
              sizeClasses.icon
            )}>
              {icon}
            </div>
          )}
        </div>

        {/* Value */}
        <div className="space-y-1">
          <div className={clsx(
            'font-bold',
            colorClasses.accent,
            sizeClasses.value
          )}>
            {value}
          </div>

          {subtitle && (
            <div className={clsx(
              'text-[#888] font-medium',
              sizeClasses.subtitle
            )}>
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-white opacity-5 to-transparent rounded-full blur-sm opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-8 h-8 bg-gradient-to-tr from-white opacity-5 to-transparent rounded-full blur-sm opacity-30"></div>
    </div>
  );
};