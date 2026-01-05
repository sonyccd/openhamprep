import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { PostHogProvider } from "@/hooks/usePostHog";
import { PendoProvider } from "@/hooks/usePendo";
import { AppNavigationProvider } from "@/hooks/useAppNavigation";
import { ThemeProvider } from "next-themes";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";

// Lazy load pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Admin = lazy(() => import("./pages/Admin"));
const OAuthConsent = lazy(() => import("./pages/OAuthConsent"));
const QuestionPage = lazy(() => import("./pages/QuestionPage"));
const QuestionRedirect = lazy(() => import("./pages/QuestionRedirect"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

import { Loader2 } from "lucide-react";

// Simple loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PostHogProvider>
          <PendoProvider>
            <AppNavigationProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <PWAInstallBanner />
                <BrowserRouter>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/admin" element={<Admin />} />
                      <Route path="/oauth/consent" element={<OAuthConsent />} />
                      <Route path="/questions/:id" element={<QuestionPage />} />
                      {/* Short URL alias for question links - redirects to canonical URL */}
                      <Route path="/q/:id" element={<QuestionRedirect />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </TooltipProvider>
            </AppNavigationProvider>
          </PendoProvider>
        </PostHogProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
