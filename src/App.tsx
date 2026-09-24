import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ohp/Toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { PendoProvider } from "@/hooks/usePendo";
import { AmplitudeProvider } from "@/hooks/useAmplitude";
import { AppNavigationProvider } from "@/hooks/useAppNavigation";
import { AccessibilityProvider } from "@/hooks/useAccessibility";
import { useWindowControlsOverlay } from "@/hooks/useWindowControlsOverlay";
import { ThemeProvider } from "next-themes";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { muiTheme } from "@/theme/muiTheme";
import { MuiColorSchemeSync } from "@/theme/MuiColorSchemeSync";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import { FullPageLoader } from "@/components/ohp/FullPageLoader";

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

// Inner component that can use hooks
const AppContent = () => {
  // Enable Windows Controls Overlay detection for PWA title bar customization
  useWindowControlsOverlay();

  return (
    <>
      {/* sonner is the app's toast system, and a deliberate exception to the
          MUI-only rule: MUI's Snackbar shows one notification at a time, while
          sonner stacks them. See docs/MUI_MIGRATION_STRATEGY.md §5.3. */}
      <Toaster />
      <PWAInstallBanner />
      <BrowserRouter>
        <Suspense fallback={<FullPageLoader label="Loading page" />}>
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
        that disagrees with the OS preference. MUI's own styles follow
        next-themes because the theme's CSS variables are scoped to those same
        .light/.dark selectors, and the hand-written CSS in index.css keys off
        them too.
        storageManager={null} stops MUI keeping a competing copy of the
        preference in localStorage. CssBaseline is the reset now that Tailwind's
        preflight is gone; every page is MUI, so there is nothing left for it
        to fight. */}
    <MuiThemeProvider
      theme={muiTheme}
      defaultMode="system"
      storageManager={null}
      colorSchemeNode={null}
      noSsr
    >
      <CssBaseline />
      <MuiColorSchemeSync />
      <AccessibilityProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <PendoProvider>
              <AmplitudeProvider>
                <AppNavigationProvider>
                  <AppContent />
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
