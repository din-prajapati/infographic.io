import { Switch, Route, Redirect, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient, REDIRECT_TO_AUTH_KEY } from "./lib/queryClient";
import { AuthProvider, useAuth } from "./lib/auth";
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
import { ErrorBoundary } from "./components/ui/error-boundary";

function ProtectedRoute({ component: Component }: { component: () => JSX.Element }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Component /> : <Redirect to="/auth" />;
}

function EditorRoute() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split('?')[1]);
  const designId = params.get('designId') || undefined;
  const templateId = params.get('templateId') || undefined;
  const [, navigate] = useLocation();

  const handleBackFromEditor = () => {
    navigate('/templates');
  };

  return (
    <ProtectedRoute
      component={() => (
        <EditorLayout
          onBackClick={handleBackFromEditor}
          designId={designId}
          templateId={templateId}
        />
      )}
    />
  );
}

function TemplatesPageWrapper() {
  const [, navigate] = useLocation();
  const handleOpenTemplate = (templateId?: string) => {
    const url = templateId ? `/editor?templateId=${templateId}` : '/editor';
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
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Redirect to="/templates" /> : <LandingPage />;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/templates" component={() => <ProtectedRoute component={() => <AppLayoutWithHeader component={TemplatesPageWrapper} />} />} />
      <Route path="/my-designs" component={() => <ProtectedRoute component={() => <AppLayoutWithHeader component={MyDesignsPageWrapper} />} />} />
      <Route path="/account" component={() => <ProtectedRoute component={() => <AppLayoutWithHeader component={AccountPage} />} />} />
      <Route path="/usage" component={() => <ProtectedRoute component={() => <UsageDashboardPage />} />} />
      <Route path="/editor" component={EditorRoute} />
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
    </ErrorBoundary>
  );
}
