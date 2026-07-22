import { useEffect } from "react";
import { Switch, Route, Redirect, useLocation, useSearch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient, REDIRECT_TO_AUTH_KEY } from "./lib/queryClient";
import { AuthProvider, useAuth } from "./lib/auth";
import { APP_ORIGIN, isApexHost, isAppHost } from "./lib/hostRouting";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/sonner";
import { TemplatesPage } from "./components/pages/TemplatesPage";
import { MyDesignsPage } from "./components/pages/MyDesignsPage";
import { AccountPage } from "./components/pages/AccountPage";
import { EditorLayout } from "./components/editor/EditorLayout";
import { AppHeader } from "./components/navigation/AppHeader";
import AuthPage from "./pages/AuthPage";
import PricingPage from "./pages/PricingPage";
import LandingPage from "./pages/LandingPage";
import UsageDashboardPage from "./pages/UsageDashboardPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import TermsPage from "./pages/legal/TermsPage";
import PrivacyPage from "./pages/legal/PrivacyPage";
import RefundPolicyPage from "./pages/legal/RefundPolicyPage";
import CookiesPage from "./pages/legal/CookiesPage";
import { ErrorBoundary } from "./components/ui/error-boundary";
import { ThemeProvider } from "./lib/theme-provider";

function ProtectedRoute({ component: Component }: { component: () => JSX.Element }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return isAuthenticated ? <Component /> : <Redirect to="/auth" />;
}

/** App-only routes (auth, editor, templates, etc.) don't exist on the apex marketing host — bounce to the same path on app.buildographic.com. */
function AppOnlyRoute({ component: Component }: { component: () => JSX.Element }) {
  useEffect(() => {
    if (isApexHost()) {
      window.location.replace(`${APP_ORIGIN}${window.location.pathname}${window.location.search}`);
    }
  }, []);
  if (isApexHost()) return null;
  return <Component />;
}

function EditorInner() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const designId = params.get('designId') || undefined;
  const templateId = params.get('templateId') || undefined;
  const [, navigate] = useLocation();

  const handleBackFromEditor = () => {
    navigate('/templates');
  };

  return (
    <EditorLayout
      onBackClick={handleBackFromEditor}
      designId={designId}
      templateId={templateId}
    />
  );
}

function EditorRoute() {
  return <ProtectedRoute component={EditorInner} />;
}

function TemplatesPageWrapper() {
  const [, navigate] = useLocation();
  const handleOpenTemplate = (templateId?: string) => {
    const url = templateId
      ? `/editor?templateId=${encodeURIComponent(templateId)}`
      : "/editor";
    navigate(url);
  };
  return <TemplatesPage onOpenEditor={handleOpenTemplate} />;
}

function MyDesignsPageWrapper() {
  const [, navigate] = useLocation();
  const handleOpenDesign = (designId?: string) => {
    const url = designId ? `/editor?designId=${designId}` : '/editor';
    navigate(url);
  };
  return <MyDesignsPage onOpenEditor={handleOpenDesign} />;
}

/** Layout with top nav for Templates, My Designs, Account so users can navigate between them. */
function AppLayoutWithHeader({ component: Component }: { component: () => JSX.Element }) {
  return (
    <>
      <AppHeader />
      <main className="flex-1">
        <Component />
      </main>
    </>
  );
}

function HomeRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated) return <Redirect to="/templates" />;
  if (isAppHost()) return <Redirect to="/auth" />;
  return <LandingPage />;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth/callback" component={() => <AppOnlyRoute component={AuthCallbackPage} />} />
      <Route path="/auth/forgot" component={() => <AppOnlyRoute component={ForgotPasswordPage} />} />
      <Route path="/auth/reset" component={() => <AppOnlyRoute component={ResetPasswordPage} />} />
      <Route path="/auth" component={() => <AppOnlyRoute component={AuthPage} />} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/templates" component={() => <AppOnlyRoute component={() => <ProtectedRoute component={() => <AppLayoutWithHeader component={TemplatesPageWrapper} />} />} />} />
      <Route path="/my-designs" component={() => <AppOnlyRoute component={() => <ProtectedRoute component={() => <AppLayoutWithHeader component={MyDesignsPageWrapper} />} />} />} />
      <Route path="/account" component={() => <AppOnlyRoute component={() => <ProtectedRoute component={() => <AppLayoutWithHeader component={AccountPage} />} />} />} />
      <Route path="/usage" component={() => <AppOnlyRoute component={() => <ProtectedRoute component={() => <UsageDashboardPage />} />} />} />
      <Route path="/editor" component={() => <AppOnlyRoute component={EditorRoute} />} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/refund-policy" component={RefundPolicyPage} />
      <Route path="/cookies" component={CookiesPage} />
      <Route path="/" component={HomeRoute} />
      <Route component={() => <div className="min-h-screen flex items-center justify-center"><div>404 - Page Not Found</div></div>} />
    </Switch>
  );
}

/** After reload from 401, redirect to login on next load (avoids navigation being blocked during request). */
function useRedirectToAuthOnLoad() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(REDIRECT_TO_AUTH_KEY) === "1") {
    localStorage.removeItem(REDIRECT_TO_AUTH_KEY);
    window.location.replace(`${window.location.origin}/auth`);
  }
}

export default function App() {
  useRedirectToAuthOnLoad();
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider delayDuration={300}>
              <div className="min-h-screen bg-background flex flex-col">
                <Router />
              </div>
              <Toaster />
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
