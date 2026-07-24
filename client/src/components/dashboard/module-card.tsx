import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ModuleCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'purple' | 'blue' | 'gray' | 'yellow' | 'green' | 'orange' | 'red' | 'cyan' | 'pink';
  onClick?: () => void;
}

const colorConfig = {
  purple: {
    border: '#ad46ff',
    iconBg: '#f3e8ff',
    iconColor: '#9810FA',
  },
  blue: {
    border: '#2b7fff',
    iconBg: '#dbeafe',
    iconColor: '#155DFC',
  },
  gray: {
    border: '#6a7282',
    iconBg: '#f3f4f6',
    iconColor: '#4A5565',
  },
  yellow: {
    border: '#f0b100',
    iconBg: '#fef9c2',
    iconColor: '#D08700',
  },
  green: {
    border: '#00c950',
    iconBg: '#dcfce7',
    iconColor: '#00A63E',
  },
  orange: {
    border: '#ff6900',
    iconBg: '#ffedd4',
    iconColor: '#F54900',
  },
  red: {
    border: '#E7000B',
    iconBg: '#fee2e2',
    iconColor: '#dc2626',
  },
  cyan: {
    border: '#0891b2',
    iconBg: '#cffafe',
    iconColor: '#0e7490',
  },
  pink: {
    border: '#ec4899',
    iconBg: '#fce7f3',
    iconColor: '#db2777',
  },
};

export function ModuleCard({ title, value, icon: Icon, color, onClick }: ModuleCardProps) {
  const colors = colorConfig[color];

  return (
    <div
      className={`bg-white rounded-[14px] relative ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
      style={{
        borderLeft: `3.75px solid ${colors.border}`,
        borderRight: `1.25px solid ${colors.border}`,
        borderTop: `1.25px solid ${colors.border}`,
        borderBottom: `1.25px solid ${colors.border}`,
      }}
      onClick={onClick}
    >
      <div className="p-6 flex flex-col gap-2">
        {/* Icon and Value */}
        <div className="flex items-center gap-3">
          {/* Icon Container */}
          <div
            className="rounded-[10px] w-9 h-9 flex items-center justify-center shrink-0"
            style={{ backgroundColor: colors.iconBg }}
          >
            <Icon className="w-5 h-5" style={{ color: colors.iconColor }} />
          </div>
          
          {/* Value */}
          <p className="font-bold text-2xl text-[#0a0a0a] leading-8">
            {value}
          </p>
        </div>
        
        {/* Title */}
        <p className="font-medium text-sm text-[#717182] leading-5">
          {title}
        </p>
      </div>
    </div>
  );
}
