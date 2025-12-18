import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from '@/ui/AppShell';
import DashboardPage from '@/ui/pages/DashboardPage';
import ContentPage from '@/ui/pages/ContentPage';
import AudiencePage from '@/ui/pages/AudiencePage';
import PageInsightsPage from '@/ui/pages/PageInsightsPage';
import SettingsPage from '@/ui/pages/SettingsPage';
import NotFoundPage from '@/ui/pages/NotFoundPage';

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/content" element={<ContentPage />} />
        <Route path="/audience" element={<AudiencePage />} />
        <Route path="/page" element={<PageInsightsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="/dashboard" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

