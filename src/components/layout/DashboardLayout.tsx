import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-background-secondary">
      <Sidebar />
      <main className="flex-1 overflow-auto p-4">
        <Topbar />
        <div className="mx-auto max-w-[1180px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
