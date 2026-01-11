import { createContext, useContext, useState, ReactNode } from 'react';
import { View } from '@/types/navigation';

type TopicSource = 'topics' | 'lesson';

interface AppNavigationContextType {
  currentView: View;
  setCurrentView: (view: View) => void;
  reviewingTestId: string | null;
  setReviewingTestId: (id: string | null) => void;
  selectedTopicSlug: string | null;
  setSelectedTopicSlug: (slug: string | null) => void;
  selectedLessonSlug: string | null;
  setSelectedLessonSlug: (slug: string | null) => void;
  selectedGlossaryTermId: string | null;
  setSelectedGlossaryTermId: (id: string | null) => void;
  selectedSubelement: string | null;
  setSelectedSubelement: (subelement: string | null) => void;
  topicSource: TopicSource;
  navigateToTopic: (slug: string, source?: TopicSource) => void;
  navigateToTopics: () => void;
  navigateToLesson: (slug: string) => void;
  navigateToLessons: () => void;
  navigateToGlossaryTerm: (termId: string) => void;
  navigateBackFromTopic: () => void;
  navigateToSubelementPractice: (subelement?: string) => void;
}

const AppNavigationContext = createContext<AppNavigationContextType | undefined>(undefined);

export function AppNavigationProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [reviewingTestId, setReviewingTestId] = useState<string | null>(null);
  const [selectedTopicSlug, setSelectedTopicSlug] = useState<string | null>(null);
  const [selectedLessonSlug, setSelectedLessonSlug] = useState<string | null>(null);
  const [selectedGlossaryTermId, setSelectedGlossaryTermId] = useState<string | null>(null);
  const [selectedSubelement, setSelectedSubelement] = useState<string | null>(null);
  const [topicSource, setTopicSource] = useState<TopicSource>('topics');

  const navigateToTopic = (slug: string, source: TopicSource = 'topics') => {
    setSelectedTopicSlug(slug);
    setTopicSource(source);
    setCurrentView('topic-detail');
  };

  const navigateToTopics = () => {
    setSelectedTopicSlug(null);
    setCurrentView('topics');
  };

  const navigateToLesson = (slug: string) => {
    setSelectedLessonSlug(slug);
    setCurrentView('lesson-detail');
  };

  const navigateToLessons = () => {
    setSelectedLessonSlug(null);
    setCurrentView('lessons');
  };

  const navigateToGlossaryTerm = (termId: string) => {
    setSelectedGlossaryTermId(termId);
    setCurrentView('glossary');
  };

  const navigateBackFromTopic = () => {
    if (topicSource === 'lesson' && selectedLessonSlug) {
      // Go back to the lesson detail page
      setSelectedTopicSlug(null);
      setCurrentView('lesson-detail');
    } else {
      // Default: go back to topics list
      navigateToTopics();
    }
  };

  const navigateToSubelementPractice = (subelement?: string) => {
    if (subelement) {
      setSelectedSubelement(subelement);
    }
    setCurrentView('subelement-practice');
  };

  return (
    <AppNavigationContext.Provider value={{
      currentView,
      setCurrentView,
      reviewingTestId,
      setReviewingTestId,
      selectedTopicSlug,
      setSelectedTopicSlug,
      selectedLessonSlug,
      setSelectedLessonSlug,
      selectedGlossaryTermId,
      setSelectedGlossaryTermId,
      selectedSubelement,
      setSelectedSubelement,
      topicSource,
      navigateToTopic,
      navigateToTopics,
      navigateToLesson,
      navigateToLessons,
      navigateToGlossaryTerm,
      navigateBackFromTopic,
      navigateToSubelementPractice,
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
