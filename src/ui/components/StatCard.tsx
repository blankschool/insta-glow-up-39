import Card from '@/ui/components/Card';
import type { ReactNode } from 'react';

export default function StatCard(props: { label: string; value: string; hint?: string; icon?: ReactNode }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-slate-400">{props.label}</div>
          <div className="mt-2 text-2xl font-semibold">{props.value}</div>
          {props.hint && <div className="mt-1 text-xs text-slate-400">{props.hint}</div>}
        </div>
        {props.icon && <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2">{props.icon}</div>}
      </div>
    </Card>
  );
}

