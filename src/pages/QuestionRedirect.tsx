import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

/**
 * QuestionRedirect - Redirects /q/:id to /questions/:id
 *
 * This is used by the OpenGraph Edge Function to avoid redirect loops.
 * When a shared question link is clicked:
 * 1. Vercel rewrites /questions/:id to the Edge Function
 * 2. Edge Function detects browser and redirects to /q/:id (bypasses rewrite)
 * 3. This component redirects to /questions/:id using React Router (client-side)
 * 4. User sees the question page with the canonical URL in the address bar
 */
export default function QuestionRedirect() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      // Use replace to avoid adding /q/:id to browser history
      navigate(`/questions/${id}`, { replace: true });
    }
  }, [id, navigate]);

  // Show nothing while redirecting (happens instantly)
  return null;
}
