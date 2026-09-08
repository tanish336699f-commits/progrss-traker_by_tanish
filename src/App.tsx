import { useEffect, useState } from 'react';
import { Sidebar, type PageId } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { PageProvider } from '@/lib/AppContext';
import { ThemeProvider } from '@/lib/theme';
import { seedDefaults } from '@/lib/db';
import { DashboardPage } from '@/pages/DashboardPage';
import { TimerPage } from '@/pages/TimerPage';
import { ActivitiesPage } from '@/pages/ActivitiesPage';
import { StudyPage } from '@/pages/StudyPage';
import { SkillsPage } from '@/pages/SkillsPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { SettingsPage } from '@/pages/SettingsPage';

const titles: Record<PageId, string> = { dashboard: 'Dashboard', timer: 'Timer', log: 'Activities', study: 'Study', skills: 'Skills', analytics: 'Analytics', settings: 'Settings' };

function Page({ page }: { page: PageId }) {
  switch (page) {
    case 'dashboard': return <DashboardPage />;
    case 'timer': return <TimerPage />;
    case 'log': return <ActivitiesPage />;
    case 'study': return <StudyPage />;
    case 'skills': return <SkillsPage />;
    case 'analytics': return <AnalyticsPage />;
    case 'settings': return <SettingsPage />;
  }
}

function AppContent() {
  const [page, setPage] = useState<PageId>('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => { seedDefaults().then(() => setReady(true)); }, []);
  if (!ready) return <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center text-sm text-gray-500">Loading your tracker…</div>;
  return <PageProvider navigate={setPage}><div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white flex"><Sidebar current={page} onNavigate={setPage} isOpen={menuOpen} onClose={() => setMenuOpen(false)} /><div className="flex-1 min-w-0"><Header title={titles[page]} onMenuClick={() => setMenuOpen(true)} /><main className="p-4 md:p-6 max-w-7xl mx-auto"><Page page={page} /></main></div></div></PageProvider>;
}

function App() { return <ThemeProvider><AppContent /></ThemeProvider>; }
export default App;
