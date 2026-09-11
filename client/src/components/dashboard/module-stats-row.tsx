import React from 'react';
import { LucideIcon } from 'lucide-react';

type Tone = 'accent' | 'gold' | 'success' | 'warn' | 'danger' | 'info' | 'neutral';

interface StatCardData {
  label: string;
  value: string | number;
  icon: LucideIcon;
  /** legacy Tailwind colour name — still accepted and mapped to a tone below */
  color: 'purple' | 'blue' | 'gray' | 'yellow' | 'green' | 'orange' | 'red' | 'cyan' | 'pink';
}

interface ModuleStatsRowProps {
  title: string;
  stats: StatCardData[];
}

const legacyColorToTone: Record<string, Tone> = {
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

function StatCard({ label, value, icon: Icon, color }: StatCardData) {
  const tone = legacyColorToTone[color] ?? 'accent';

  return (
    <div
      className="bg-card border border-border rounded-lg p-[18px] shrink-0"
      style={{ minWidth: '150px', boxShadow: '0 1px 2px rgba(16, 29, 51, .04), 0 6px 20px rgba(16, 29, 51, .05)' }}
    >
      <div
        className="w-[34px] h-[34px] rounded-md flex items-center justify-center mb-3.5"
        style={{ backgroundColor: `var(--tone-${tone}-soft)` }}
      >
        <Icon className="w-[18px] h-[18px]" style={{ color: `var(--tone-${tone})` }} />
      </div>
      <p className="font-serif" style={{ fontSize: '24px', fontWeight: 600, lineHeight: 1, color: 'var(--foreground)' }}>
        {value}
      </p>
      <p className="mt-1.5" style={{ fontSize: '12.5px', color: 'var(--muted-foreground)' }}>
        {label}
      </p>
    </div>
  );
}

export function ModuleStatsRow({ title, stats }: ModuleStatsRowProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-serif" style={{ fontSize: '16px', fontWeight: 600, color: 'var(--foreground)' }}>{title}</h2>
      <div className="flex gap-3.5 overflow-x-auto pb-2">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>
    </div>
  );
}
