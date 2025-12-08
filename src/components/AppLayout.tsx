import { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Loader2 } from 'lucide-react';

type View = 'dashboard' | 'practice-test' | 'random-practice' | 'weak-questions' | 'bookmarks' | 'subelement-practice' | 'review-test';

interface AppLayoutProps {
  children: ReactNode;
  currentView: View;
  onViewChange: (view: View) => void;
}

export function AppLayout({ children, currentView, onViewChange }: AppLayoutProps) {
  const { user, loading: authLoading, signOut } = useAuth();
  const { bookmarks } = useBookmarks();
  const navigate = useNavigate();
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

  // Calculate weak questions
  const weakQuestionIds = questionAttempts
    ? Object.entries(
        questionAttempts.reduce((acc, attempt) => {
          if (!attempt.is_correct) {
            acc[attempt.question_id] = (acc[attempt.question_id] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>)
      )
        .filter(([_, count]) => count >= 1)
        .map(([id]) => id)
    : [];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
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
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background flex w-full">
        <DashboardSidebar
          currentView={currentView}
          onViewChange={onViewChange}
          onSignOut={handleSignOut}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          weakQuestionCount={weakQuestionIds.length}
          bookmarkCount={bookmarks?.length || 0}
          isTestAvailable={true}
          userInfo={userInfo}
        />
        <div className="flex-1 overflow-auto pt-16 md:pt-0">
          {children}
        </div>
      </div>
    </TooltipProvider>
  );
}
