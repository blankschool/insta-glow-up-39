import type { PropsWithChildren } from 'react';

export default function Card({ children }: PropsWithChildren) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5">{children}</div>;
}

