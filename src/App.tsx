import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { PendoProvider } from "@/hooks/usePendo";
import { AmplitudeProvider } from "@/hooks/useAmplitude";
import { AppNavigationProvider } from "@/hooks/useAppNavigation";
import { AccessibilityProvider } from "@/hooks/useAccessibility";
import { useWindowControlsOverlay } from "@/hooks/useWindowControlsOverlay";
import { ThemeProvider } from "next-themes";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { muiTheme } from "@/theme/muiTheme";
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

// Inner component that can use hooks
const AppContent = () => {
  // Enable Windows Controls Overlay detection for PWA title bar customization
  useWindowControlsOverlay();

  return (
    <>
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
    </>
  );
};

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>
    {/* next-themes is the only writer of the light/dark class on <html>.
        colorSchemeNode={null} is what enforces that: MUI's cssVars provider
        otherwise runs classList.remove('light','dark') + add(its own resolved
        mode) on documentElement, which would overwrite an explicit user choice
        that disagrees with the OS preference — and since Tailwind's dark:
        variants read the same class, that would flip the entire app, not just
        MUI components. MUI's own styles still follow next-themes, because the
        theme's CSS variables are scoped to those same .light/.dark selectors.
        storageManager={null} stops MUI keeping a competing copy of the
        preference in localStorage. No CssBaseline — Tailwind's preflight is
        already the reset, and MUI's would restyle every existing page. */}
    <MuiThemeProvider
      theme={muiTheme}
      defaultMode="system"
      storageManager={null}
      colorSchemeNode={null}
      noSsr
    >
      <AccessibilityProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <PendoProvider>
              <AmplitudeProvider>
                <AppNavigationProvider>
                  <TooltipProvider>
                    <AppContent />
                  </TooltipProvider>
                </AppNavigationProvider>
              </AmplitudeProvider>
            </PendoProvider>
          </AuthProvider>
        </QueryClientProvider>
      </AccessibilityProvider>
    </MuiThemeProvider>
  </ThemeProvider>
);

export default App;
