import { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { View, TestType, testTypes } from '@/types/navigation';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Loader2 } from 'lucide-react';
import { HelpButton } from '@/components/HelpButton';
import { calculateWeakQuestionIds } from '@/lib/weakQuestions';

interface AppLayoutProps {
  children: ReactNode;
  currentView: View;
  onViewChange: (view: View) => void;
  selectedTest: TestType;
  onTestChange: (test: TestType) => void;
  mobileMenuOpen?: boolean;
  onMobileMenuChange?: (open: boolean) => void;
  isTourActive?: boolean;
}

export function AppLayout({ children, currentView, onViewChange, selectedTest, onTestChange, mobileMenuOpen, onMobileMenuChange, isTourActive }: AppLayoutProps) {
  const { user, loading: authLoading, signOut } = useAuth();
  const { bookmarks } = useBookmarks();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: questionAttempts } = useQuery({
    queryKey: ['question-attempts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('question_attempts')
        .select('*')
        .eq('user_id', user!.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Calculate weak questions using shared logic
  const weakQuestionIds = questionAttempts
    ? calculateWeakQuestionIds(questionAttempts)
    : [];

  const handleSignOut = async () => {
    // Navigate first to ensure we redirect before state changes trigger re-renders
    navigate('/auth');
    await signOut();
  };

  const handleProfileUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
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
      <div className="h-screen bg-background flex w-full overflow-hidden">
        <DashboardSidebar
          currentView={currentView}
          onViewChange={onViewChange}
          onSignOut={handleSignOut}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          weakQuestionCount={weakQuestionIds.length}
          bookmarkCount={bookmarks?.length || 0}
          isTestAvailable={isTestAvailable}
          userInfo={userInfo}
          userId={user.id}
          onProfileUpdate={handleProfileUpdate}
          selectedTest={selectedTest}
          onTestChange={onTestChange}
          mobileMenuOpen={mobileMenuOpen}
          onMobileMenuChange={onMobileMenuChange}
          isTourActive={isTourActive}
        />
        <div className="flex-1 overflow-y-auto pt-16 md:pt-0 flex flex-col">
          {children}
        </div>
        <HelpButton />
      </div>
    </TooltipProvider>
  );
}
