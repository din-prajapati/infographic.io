import { lazy, Suspense, useEffect, useState } from "react";
import { Switch, Route, Redirect, useLocation, useSearch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient, REDIRECT_TO_AUTH_KEY } from "./lib/queryClient";
import { AuthProvider, useAuth } from "./lib/auth";
import { APP_ORIGIN, isApexHost, isAppHost } from "./lib/hostRouting";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/sonner";
import { TemplatesPage } from "./components/pages/TemplatesPage";
import { MyDesignsPage } from "./components/pages/MyDesignsPage";
import { EditorLayout as LegacyEditorLayout } from "./components/editor/legacy/EditorLayout";
import { WorkspaceLayout } from "./features/workspace/WorkspaceLayout";
import HowItWorksPage from "./features/workspace/HowItWorksPage";
import ListingsPage from "./features/listings/ListingsPage";
import NewPropertyPage from "./features/listings/NewPropertyPage";
import ListingDetailPage from "./features/listings/ListingDetailPage";
import AgentBrandPage from "./features/agent-brand/AgentBrandPage";
import AuthPage from "./pages/AuthPage";
import PricingPage from "./pages/PricingPage";
import LandingPage from "./pages/LandingPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import VerifyEmailPage from "./pages/auth/VerifyEmailPage";
import { EmailVerificationRequiredDialog } from "./components/auth/EmailVerificationRequiredDialog";
import TermsPage from "./pages/legal/TermsPage";
import PrivacyPage from "./pages/legal/PrivacyPage";
import RefundPolicyPage from "./pages/legal/RefundPolicyPage";
import CookiesPage from "./pages/legal/CookiesPage";
import { ErrorBoundary } from "./components/ui/error-boundary";
import { ThemeProvider } from "./lib/theme-provider";
import { VersionBadge } from "./components/VersionBadge";
import { FormatPickerDialog } from "./components/pages/FormatPickerDialog";
import { useCanvasStore } from "./hooks/useCanvasStore";
import { initializeV3NavigationGuard } from './lib/v3NavigationGuard';
import { buildV3EditorUrl, isLegacyEditorRequest, parseV3EditorParams } from './lib/v3EditorUrl';

initializeV3NavigationGuard();

const V3Editor = lazy(() => import('./components/editor/v3/V3Editor'));

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

  // V3 is the default editor for every /editor URL; `editor=legacy` opens the legacy editor side by side.
  if (!isLegacyEditorRequest(search)) {
    return <Suspense fallback={<div role="status" className="p-6">Opening design…</div>}><V3Editor {...parseV3EditorParams(search)} /></Suspense>;
  }

  return (
    <LegacyEditorLayout
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
  const [pickerOpen, setPickerOpen] = useState(false);
  const loadCanvas = useCanvasStore((state) => state.loadCanvas);

  const handleOpenTemplate = (templateId?: string) => {
    if (templateId) {
      navigate(buildV3EditorUrl({ templateId }));
    } else {
      // No template selected — open Format Picker so user picks a canvas size first (AC1).
      setPickerOpen(true);
    }
  };

  const handleFormatSelect = (width: number, height: number, templateId?: string) => {
    setPickerOpen(false);
    if (templateId) {
      navigate(buildV3EditorUrl({ templateId }));
    } else {
      // Pre-size the canvas before navigating to blank editor (AC3).
      loadCanvas({ elements: [], canvasWidth: width, canvasHeight: height, backgroundColor: '#FFFFFF', zoom: 1 });
      navigate(buildV3EditorUrl({ canvasSize: { width, height } }));
    }
  };

  return (
    <>
      <TemplatesPage onOpenEditor={handleOpenTemplate} />
      <FormatPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleFormatSelect}
      />
    </>
  );
}

function MyDesignsPageWrapper() {
  const [, navigate] = useLocation();
  const [pickerOpen, setPickerOpen] = useState(false);
  const loadCanvas = useCanvasStore((state) => state.loadCanvas);

  const handleOpenDesign = (designId?: string) => {
    if (designId) {
      navigate(buildV3EditorUrl({ designId }));
    } else {
      // No design selected — open Format Picker so user picks canvas size first (AC1).
      setPickerOpen(true);
    }
  };

  const handleFormatSelect = (width: number, height: number, templateId?: string) => {
    setPickerOpen(false);
    if (templateId) {
      navigate(buildV3EditorUrl({ templateId }));
    } else {
      // Pre-size the canvas before navigating to blank editor (AC3).
      loadCanvas({ elements: [], canvasWidth: width, canvasHeight: height, backgroundColor: '#FFFFFF', zoom: 1 });
      navigate(buildV3EditorUrl({ canvasSize: { width, height } }));
    }
  };

  return (
    <>
      <MyDesignsPage onOpenEditor={handleOpenDesign} />
      <FormatPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleFormatSelect}
      />
    </>
  );
}

/**
 * Authenticated non-editor pages render inside one persistent workspace shell (rev-2 spec §2–§3).
 * Every component below is defined at module scope, so neither the shell nor the page remounts when the URL changes
 * (e.g. the library's ?q= search updates while typing).
 */
const WORKSPACE_PATH = /^\/(?:workspace|listings|agent-brand|templates|my-designs|account|usage)(?:\/|$)/;
/** Home is reserved for the Assistant Home workstream; until it ships it opens Listings. */
function WorkspaceHomeRoute() { return <Redirect to="/listings" replace />; }
/** The Account and Usage pages became tabs of the Settings dialog; old links open it over Listings. */
function AccountRedirect() { return <Redirect to="/listings#settings/account" replace />; }
function UsageRedirect() { return <Redirect to="/listings#settings/usage" replace />; }
function WorkspaceSection() {
  return (
    <WorkspaceLayout>
      <Switch>
        <Route path="/workspace/how-it-works" component={HowItWorksPage} />
        <Route path="/workspace" component={WorkspaceHomeRoute} />
        {/* "/listings/new" must stay above "/listings/:propertyId". */}
        <Route path="/listings/new" component={NewPropertyPage} />
        <Route path="/listings/:propertyId">{params => <ListingDetailPage key={params.propertyId} propertyId={decodeURIComponent(params.propertyId)} />}</Route>
        <Route path="/listings" component={ListingsPage} />
        <Route path="/agent-brand" component={AgentBrandPage} />
        <Route path="/templates" component={TemplatesPageWrapper} />
        <Route path="/my-designs" component={MyDesignsPageWrapper} />
        <Route path="/account" component={AccountRedirect} />
        <Route path="/usage" component={UsageRedirect} />
        <Route><div className="ws-empty"><h2>Page not found</h2></div></Route>
      </Switch>
    </WorkspaceLayout>
  );
}
function ProtectedWorkspace() { return <ProtectedRoute component={WorkspaceSection} />; }
function WorkspaceShellRoute() { return <AppOnlyRoute component={ProtectedWorkspace} />; }

function HomeRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated) return <Redirect to="/listings" />;
  if (isAppHost()) return <Redirect to="/auth" />;
  return <LandingPage />;
}

function Router() {
  const [location] = useLocation();
  if (WORKSPACE_PATH.test(location)) return <WorkspaceShellRoute />;
  return (
    <Switch>
      <Route path="/auth/callback" component={() => <AppOnlyRoute component={AuthCallbackPage} />} />
      <Route path="/auth/forgot" component={() => <AppOnlyRoute component={ForgotPasswordPage} />} />
      <Route path="/auth/reset" component={() => <AppOnlyRoute component={ResetPasswordPage} />} />
      {/* Must stay above "/auth": Switch renders the first match, and the emailed link is app-only. */}
      <Route path="/auth/verify-email" component={() => <AppOnlyRoute component={VerifyEmailPage} />} />
      <Route path="/auth" component={() => <AppOnlyRoute component={AuthPage} />} />
      <Route path="/pricing" component={PricingPage} />
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
              {/* Mounted once, app-wide: opens on the EMAIL_NOT_VERIFIED event (US-LAUNCH-014 AC9). */}
              <EmailVerificationRequiredDialog />
              <VersionBadge />
              <Toaster />
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
