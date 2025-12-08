import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hashParams = window.location.hash;
    const hasAuthCallback = hashParams && hashParams.includes('access_token');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, 'hasSession:', !!session);
        
        // Only update state from listener if not handling auth callback
        // This prevents race condition where INITIAL_SESSION sets loading=false too early
        if (!hasAuthCallback || event === 'SIGNED_IN') {
          setSession(session);
          setUser(session?.user ?? null);
          
          // Only set loading false if we're not waiting for auth callback
          if (!hasAuthCallback) {
            setLoading(false);
          }
        }
        
        // Clear the hash from URL after processing auth callback
        if (event === 'SIGNED_IN' && window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    );

    // Handle auth callback from email verification (hash contains tokens)
    const handleAuthCallback = async () => {
      if (hasAuthCallback) {
        const isEmailVerification = hashParams.includes('type=signup');
        console.log('Processing auth callback, isEmailVerification:', isEmailVerification);
        
        // Parse the hash to get tokens
        const params = new URLSearchParams(hashParams.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        
        if (accessToken && refreshToken) {
          // Explicitly set the session with the tokens from the URL
          const { data: { session }, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (error) {
            console.error('Auth callback error:', error);
          }
          
          if (session) {
            console.log('Session set successfully, user:', session.user?.email);
            setSession(session);
            setUser(session.user);
            
            // Show success toast for email verification
            if (isEmailVerification) {
              toast({
                title: "Email verified!",
                description: "Your email has been verified successfully. Welcome!",
              });
            }
          }
        }
        setLoading(false);
      } else {
        // No hash params, just get existing session
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    };

    handleAuthCallback();

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    // Always redirect to the production domain for email verification
    const redirectUrl = 'https://rarstestprep.app/';
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName
        }
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
