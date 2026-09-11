import React from 'react';
import { LucideIcon } from 'lucide-react';

export type ModuleTone = 'accent' | 'gold' | 'success' | 'warn' | 'danger' | 'info' | 'neutral';

interface ModuleCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  tone: ModuleTone;
  /** @deprecated use `tone` — kept so older Tailwind colour names still render something sensible */
  color?: string;
  onClick?: () => void;
}

const legacyColorToTone: Record<string, ModuleTone> = {
  purple: 'accent',
  blue: 'info',
  gray: 'neutral',
  yellow: 'gold',
  green: 'success',
  orange: 'warn',
  red: 'danger',
  cyan: 'info',
  pink: 'gold',
};

export function ModuleCard({ title, value, icon: Icon, tone, color, onClick }: ModuleCardProps) {
  const resolvedTone: ModuleTone = tone ?? legacyColorToTone[color ?? ''] ?? 'accent';

  return (
    <div
      className={`bg-card border border-border rounded-lg p-[18px] ${onClick ? 'cursor-pointer hover:border-[#c9d3d2] transition-colors' : ''}`}
      style={{ boxShadow: '0 1px 2px rgba(16, 29, 51, .04), 0 6px 20px rgba(16, 29, 51, .05)' }}
      onClick={onClick}
    >
      <div
        className="w-[34px] h-[34px] rounded-md flex items-center justify-center mb-3.5"
        style={{ backgroundColor: `var(--tone-${resolvedTone}-soft)` }}
      >
        <Icon className="w-[18px] h-[18px]" style={{ color: `var(--tone-${resolvedTone})` }} />
      </div>
      <p className="font-serif" style={{ fontSize: '26px', fontWeight: 600, lineHeight: 1, color: 'var(--foreground)' }}>
        {value}
      </p>
      <p className="mt-1.5" style={{ fontSize: '12.5px', color: 'var(--muted-foreground)' }}>
        {title}
      </p>
    </div>
  );
}
