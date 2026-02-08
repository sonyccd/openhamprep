import { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useQueryClient } from '@tanstack/react-query';
import { useFullProfile, useQuestionAttemptsWithNames } from '@/hooks/useDashboardData';
import { queryKeys } from '@/services/queryKeys';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { View, TestType, testTypes } from '@/types/navigation';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Loader2 } from 'lucide-react';
import { HelpButton } from '@/components/HelpButton';
import { calculateWeakQuestionIds } from '@/lib/weakQuestions';
import { filterByTestType } from '@/lib/testTypeUtils';
import { SkipLink } from '@/components/SkipLink';
import { useCommunityPromoToast } from '@/hooks/useCommunityPromoToast';

interface AppLayoutProps {
  children: ReactNode;
  currentView: View;
  onViewChange: (view: View) => void;
  selectedTest: TestType;
  onTestChange: (test: TestType) => void;
  onSearch?: () => void;
}

export function AppLayout({ children, currentView, onViewChange, selectedTest, onTestChange, onSearch }: AppLayoutProps) {
  const { user, loading: authLoading, signOut } = useAuth();
  const { bookmarks } = useBookmarks();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { data: profile } = useFullProfile();
  const { data: questionAttempts } = useQuestionAttemptsWithNames();

  // Filter attempts by selected test type, then calculate weak questions
  const filteredAttempts = filterByTestType(
    questionAttempts || [],
    selectedTest,
    (a) => a.display_name
  );
  const weakQuestionIds = filteredAttempts.length > 0
    ? calculateWeakQuestionIds(filteredAttempts)
    : [];

  // Filter bookmarks by selected test type
  const filteredBookmarks = filterByTestType(
    bookmarks || [],
    selectedTest,
    (b) => b.display_name
  );

  // Show community promo toast for eligible users
  useCommunityPromoToast({
    userCreatedAt: user?.created_at,
    forumUsername: profile?.forum_username,
    isAuthenticated: !!user,
  });

  const handleSignOut = async () => {
    // Navigate first to ensure we redirect before state changes trigger re-renders
    navigate('/auth');
    await signOut();
  };

  const handleProfileUpdate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.profile.byUser(user?.id ?? '') });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <>{children}</>;
  }

  const userInfo = {
    displayName: profile?.display_name || null,
    email: user.email || null,
    forumUsername: profile?.forum_username || null,
  };

  const currentTest = testTypes.find(t => t.id === selectedTest);
  const isTestAvailable = currentTest?.available ?? false;

  return (
    <TooltipProvider>
      <SkipLink />
      <div className="h-screen bg-background flex w-full overflow-hidden">
        <DashboardSidebar
          currentView={currentView}
          onViewChange={onViewChange}
          onSignOut={handleSignOut}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          weakQuestionCount={weakQuestionIds.length}
          bookmarkCount={filteredBookmarks.length}
          isTestAvailable={isTestAvailable}
          userInfo={userInfo}
          userId={user.id}
          onProfileUpdate={handleProfileUpdate}
          selectedTest={selectedTest}
          onTestChange={onTestChange}
          onSearch={onSearch}
        />
        <main id="main-content" className="flex-1 overflow-y-auto pt-safe-header md:pt-0 flex flex-col">
          {children}
        </main>
        <HelpButton />
      </div>
    </TooltipProvider>
  );
}
