import { NavLink } from 'react-router-dom';
import { BarChart3, Globe, Image, Settings, Users } from 'lucide-react';

const items = [
  { to: '/', label: 'Dashboard', icon: BarChart3 },
  { to: '/content', label: 'Conteúdo', icon: Image },
  { to: '/audience', label: 'Audiência', icon: Users },
  { to: '/page', label: 'Page Insights', icon: Globe },
  { to: '/settings', label: 'Configurações', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="sticky top-0 h-screen w-[280px] border-r border-slate-800 bg-slate-950/60 backdrop-blur">
      <div className="px-5 py-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 px-4 py-3">
          <div className="text-sm font-semibold">Instagram Analytics</div>
          <div className="text-xs text-slate-400">Sem login • via Edge Function</div>
        </div>
      </div>
      <nav className="px-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                isActive ? 'bg-slate-800/60 text-white' : 'text-slate-300 hover:bg-slate-900/60',
              ].join(' ')
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4 text-xs text-slate-400">
          Tokens ficam em secrets do Supabase.
        </div>
      </div>
    </aside>
  );
}

