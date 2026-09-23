import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { FullPageLoader } from '@/components/ohp/FullPageLoader';

/**
 * Index page - redirects users based on authentication status
 * - Authenticated users → Dashboard
 * - Non-authenticated users → Auth page
 *
 * Marketing content is now served from static site at openhamprep.com
 */
const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (user) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/auth', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  // Show loading while determining auth state and redirecting
  return <FullPageLoader />;
};

export default Index;
