import { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useQueryClient } from '@tanstack/react-query';
import { useFullProfile, useQuestionAttemptsWithNames } from '@/hooks/useDashboardData';
import { queryKeys } from '@/services/queryKeys';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { View, TestType, testTypes } from '@/types/navigation';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
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

export const AppLayout = ({ children, currentView, onViewChange, selectedTest, onTestChange, onSearch }: AppLayoutProps) => {
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
      <Box
        role="status"
        aria-label="Loading"
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress size={32} />
      </Box>
    );
  }

  const userInfo = user ? {
    displayName: profile?.display_name || null,
    email: user.email || null,
    forumUsername: profile?.forum_username || null,
  } : undefined;

  const currentTest = testTypes.find(t => t.id === selectedTest);
  const isTestAvailable = currentTest?.available ?? false;

  return (
    <>
      <SkipLink />
      {/*
        No TooltipProvider: MUI's Tooltip needs no context, unlike the Radix
        one this replaced. The whole nav shell is on MUI now, so nothing below
        here required it.
      */}
      <Box
        sx={{
          height: '100vh',
          width: '100%',
          bgcolor: 'background.default',
          display: 'flex',
          overflow: 'hidden',
        }}
      >
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
          userId={user?.id}
          onProfileUpdate={user ? handleProfileUpdate : undefined}
          selectedTest={selectedTest}
          onTestChange={onTestChange}
          onSearch={onSearch}
        />
        {/*
          pt-safe-header stays a class: it is max(4rem, env(safe-area-inset-top)
          + 3rem), and env() is a CSS environment variable the theme does not
          model. It clears the fixed mobile hamburger; md:pt-0 drops it once the
          desktop rail takes over.
        */}
        <Box
          component="main"
          id="main-content"
          className="pt-safe-header md:pt-0"
          sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
        >
          {children}
        </Box>
        <HelpButton />
      </Box>
    </>
  );
};
