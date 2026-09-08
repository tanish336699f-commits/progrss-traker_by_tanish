import { createContext, useContext, type ReactNode } from 'react';
import type { PageId } from '@/components/Sidebar';

const PageContext = createContext<((page: PageId) => void) | null>(null);

export function PageProvider({ navigate, children }: { navigate: (page: PageId) => void; children: ReactNode }) {
  return <PageContext.Provider value={navigate}>{children}</PageContext.Provider>;
}

export function useNavigatePage() {
  const navigate = useContext(PageContext);
  if (!navigate) throw new Error('useNavigatePage must be used within PageProvider');
  return navigate;
}
