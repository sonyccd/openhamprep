import { createContext, useContext, useState, ReactNode } from 'react';
import { View } from '@/types/navigation';

interface AppNavigationContextType {
  currentView: View;
  setCurrentView: (view: View) => void;
  reviewingTestId: string | null;
  setReviewingTestId: (id: string | null) => void;
  selectedTopicSlug: string | null;
  setSelectedTopicSlug: (slug: string | null) => void;
  selectedGlossaryTermId: string | null;
  setSelectedGlossaryTermId: (id: string | null) => void;
  navigateToTopic: (slug: string) => void;
  navigateToTopics: () => void;
  navigateToGlossaryTerm: (termId: string) => void;
}

const AppNavigationContext = createContext<AppNavigationContextType | undefined>(undefined);

export function AppNavigationProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [reviewingTestId, setReviewingTestId] = useState<string | null>(null);
  const [selectedTopicSlug, setSelectedTopicSlug] = useState<string | null>(null);
  const [selectedGlossaryTermId, setSelectedGlossaryTermId] = useState<string | null>(null);

  const navigateToTopic = (slug: string) => {
    setSelectedTopicSlug(slug);
    setCurrentView('topic-detail');
  };

  const navigateToTopics = () => {
    setSelectedTopicSlug(null);
    setCurrentView('topics');
  };

  const navigateToGlossaryTerm = (termId: string) => {
    setSelectedGlossaryTermId(termId);
    setCurrentView('glossary');
  };

  return (
    <AppNavigationContext.Provider value={{
      currentView,
      setCurrentView,
      reviewingTestId,
      setReviewingTestId,
      selectedTopicSlug,
      setSelectedTopicSlug,
      selectedGlossaryTermId,
      setSelectedGlossaryTermId,
      navigateToTopic,
      navigateToTopics,
      navigateToGlossaryTerm,
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
