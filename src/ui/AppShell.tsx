import { Outlet } from 'react-router-dom';
import Sidebar from '@/ui/components/Sidebar';
import Topbar from '@/ui/components/Topbar';

export default function AppShell() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="flex">
        <Sidebar />
        <main className="min-h-screen flex-1">
          <Topbar />
          <div className="mx-auto max-w-7xl px-6 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

