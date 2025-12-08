import { createContext, useContext, useState, ReactNode } from 'react';

type View = 'dashboard' | 'practice-test' | 'random-practice' | 'weak-questions' | 'bookmarks' | 'subelement-practice' | 'review-test' | 'glossary' | 'glossary-flashcards';

interface AppNavigationContextType {
  currentView: View;
  setCurrentView: (view: View) => void;
  reviewingTestId: string | null;
  setReviewingTestId: (id: string | null) => void;
}

const AppNavigationContext = createContext<AppNavigationContextType | undefined>(undefined);

export function AppNavigationProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [reviewingTestId, setReviewingTestId] = useState<string | null>(null);

  return (
    <AppNavigationContext.Provider value={{ 
      currentView, 
      setCurrentView, 
      reviewingTestId, 
      setReviewingTestId 
    }}>
      {children}
    </AppNavigationContext.Provider>
  );
}

export function useAppNavigation() {
  const context = useContext(AppNavigationContext);
  if (context === undefined) {
    throw new Error('useAppNavigation must be used within an AppNavigationProvider');
  }
  return context;
}
