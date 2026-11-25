/**
 * Module → test map. One entry per product module.
 *
 *   sources    path prefixes (repo-relative) owned by the module — used by `--changed`
 *   clientUnit vitest filters, relative to client/src (path substrings)
 *   apiUnit    vitest filters, relative to api/ (unit config; *.integration.spec.ts excluded)
 *   e2e        Playwright folder under e2e/
 *   e2eConfig  Playwright config for that folder (default: playwright.config.ts → full stack on :5000)
 *
 * Keep this file in step with the folder layout: a new module = a new entry + e2e/<module>/ + its unit test folder.
 */
export const MODULES = {
  workspace: {
    description: 'Workspace shell, navigation, account menu, shared V3 theme, unsaved-work guard',
    sources: ['client/src/features/workspace/', 'client/src/styles/v3-tokens.css', 'client/src/lib/v3NavigationGuard.ts', 'client/src/App.tsx'],
    clientUnit: ['features/workspace/', 'lib/__tests__/v3NavigationGuard'],
    apiUnit: [],
    e2e: 'workspace',
    e2eConfig: 'e2e/mocked.config.ts',
  },
  settings: {
    description: 'Settings dialog (#settings/<tab>): account menu entry, search, Account/Billing/Usage/Team/Appearance/Privacy tabs, /users/me',
    sources: ['client/src/features/settings/', 'api/src/modules/users/'],
    clientUnit: ['features/settings/'],
    apiUnit: ['tests/users/', 'tests/payments/plan-user-limits'],
    e2e: 'settings',
    e2eConfig: 'e2e/mocked.config.ts',
  },
  listings: {
    description: 'Listing library, property create/edit, photos, property-linked designs',
    sources: ['client/src/features/listings/', 'client/src/lib/listingApi.ts', 'api/src/modules/properties/', 'api/src/modules/storage/', 'shared/listingWorkflow.ts', 'client/src/lib/v3ListingWorkflow.ts', 'client/src/lib/v3MediaUpload.ts', 'client/src/hooks/useV3ListingWorkflow.ts'],
    clientUnit: ['features/listings/', 'lib/__tests__/v3ListingWorkflow', 'lib/__tests__/listingBindings', 'lib/__tests__/v3MediaUpload', 'lib/__tests__/propertyIcons', 'hooks/__tests__/useV3ListingWorkflow'],
    apiUnit: ['tests/properties/', 'tests/listing/', 'tests/storage/'],
    e2e: 'listings',
    e2eConfig: 'e2e/mocked.config.ts',
  },
  'agent-brand': {
    description: 'Saved Agent & Brand profile page',
    sources: ['client/src/features/agent-brand/', 'api/src/modules/properties/listing-profiles.controller.ts'],
    clientUnit: ['features/agent-brand/'],
    apiUnit: ['tests/properties/'],
    e2e: 'agent-brand',
    e2eConfig: 'e2e/mocked.config.ts',
  },
  editor: {
    description: 'V3 editor (canvas, panels, save, listing panel, deep links)',
    sources: ['client/src/components/editor/v3/', 'client/src/components/canvas/', 'client/src/lib/v3', 'client/src/hooks/useV3', 'client/src/hooks/useCanvasStore', 'client/src/lib/canvas', 'client/src/lib/paint', 'client/src/lib/shape', 'client/src/lib/lineGeometry', 'client/src/lib/textLayout', 'client/src/lib/layout/'],
    clientUnit: ['components/editor/v3/', 'components/canvas/', 'hooks/__tests__/useV3', 'hooks/__tests__/useCanvasStore', 'lib/__tests__/v3', 'lib/__tests__/canvas', 'lib/__tests__/paint', 'lib/__tests__/shape', 'lib/__tests__/lineGeometry', 'lib/__tests__/textLayout', 'lib/__tests__/elementStyles', 'lib/__tests__/fontMap', 'lib/layout/'],
    apiUnit: ['tests/canvas/', 'tests/designs/'],
    e2e: 'editor',
    e2eConfig: 'e2e/editor/playwright.config.ts',
  },
  'editor-real-backend': {
    description: 'V3 editor against the running local stack (needs npm run dev + .agent-logs/real-backend)',
    sources: [],
    clientUnit: [],
    apiUnit: [],
    e2e: 'editor/real-backend',
    e2eConfig: 'e2e/editor/real-backend/playwright.config.ts',
  },
  'editor-legacy': {
    description: 'Retired legacy editor, reachable via /editor?editor=legacy (delete with EditorLayout)',
    sources: ['client/src/components/editor/EditorLayout.tsx', 'client/src/components/editor/RightSidebar.tsx', 'client/src/components/editor/CenterCanvas.tsx', 'client/src/components/editor/CanvasEditToolbar.tsx', 'e2e/fixtures/legacy-editor.ts'],
    clientUnit: ['components/editor/__tests__/'],
    apiUnit: [],
    e2e: 'editor-legacy',
  },
  templates: {
    description: 'Templates page, format picker, save as template',
    sources: ['client/src/components/pages/TemplatesPage.tsx', 'client/src/components/pages/FormatPickerDialog.tsx', 'api/src/modules/templates/'],
    clientUnit: ['lib/__tests__/v3TemplateWorkflow'],
    apiUnit: ['tests/canvas/'],
    e2e: 'templates',
  },
  designs: {
    description: 'My designs page and designs API',
    sources: ['client/src/components/pages/MyDesignsPage.tsx', 'api/src/modules/designs/'],
    clientUnit: [],
    apiUnit: ['tests/designs/'],
    e2e: 'designs',
  },
  'ai-generation': {
    description: 'AI chat, compose, Ideogram/OpenAI generation',
    sources: ['client/src/components/ai-chat/', 'api/src/modules/ai-generation/', 'api/src/modules/infographics/', 'api/src/modules/conversations/'],
    clientUnit: ['components/ai-chat/', 'hooks/__tests__/useComposeProgress', 'hooks/__tests__/useGenerationPrefs'],
    apiUnit: ['tests/ai-generation/', 'tests/ai/', 'tests/infographics/'],
    e2e: 'ai-generation',
  },
  auth: {
    description: 'Login, registration, password reset, email verification',
    sources: ['client/src/pages/AuthPage.tsx', 'client/src/pages/auth/', 'client/src/lib/auth.tsx', 'api/src/modules/auth/', 'api/src/modules/email/'],
    clientUnit: ['components/ui/__tests__/EmailVerificationBanner'],
    apiUnit: ['tests/auth/', 'tests/email/'],
    e2e: 'auth',
  },
  payments: {
    description: 'Pricing, checkout, subscriptions, plan limits',
    sources: ['client/src/pages/PricingPage.tsx', 'client/src/lib/planConfig', 'client/src/lib/pricingFormulas', 'api/src/modules/payments/', 'server/payments/'],
    clientUnit: ['pages/__tests__/PricingPage', 'lib/__tests__/planConfig', 'lib/__tests__/pricingFormulas'],
    apiUnit: ['tests/payments/'],
    e2e: 'payments',
  },
  platform: {
    description: 'Cross-cutting: API client, design tokens, legal pages, beta mode, config, infra',
    sources: ['client/src/lib/api.ts', 'client/src/lib/queryClient.ts', 'client/src/index.css', 'api/src/common/', 'api/src/config/', 'server/'],
    clientUnit: ['lib/__tests__/api', 'lib/__tests__/queryClient', 'lib/__tests__/alias-resolution'],
    apiUnit: ['tests/common/', 'tests/config/', 'tests/infra/'],
    e2e: 'platform',
  },
};

/** Maps a changed repo-relative path to the modules that own it. Test files map to the module whose folder holds them. */
export function modulesForPath(file) {
  const normalized = file.replace(/\\/g, '/');
  const hits = new Set();
  const e2e = /^e2e\/([^/]+)\//.exec(normalized);
  if (e2e) {
    const folder = normalized.startsWith('e2e/editor/real-backend/') ? 'editor-real-backend' : e2e[1];
    if (MODULES[folder]) hits.add(folder);
  }
  for (const [name, module] of Object.entries(MODULES)) {
    if (module.sources.some(prefix => normalized.startsWith(prefix))) hits.add(name);
    if (module.clientUnit.some(filter => normalized.startsWith(`client/src/${filter}`))) hits.add(name);
    if (module.apiUnit.some(filter => normalized.startsWith(`api/${filter}`))) hits.add(name);
  }
  return [...hits];
}
