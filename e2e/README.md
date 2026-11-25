# E2E tests — layout and how to run one module

Specs are grouped by **product module**. When you change a module, run only that module's unit and E2E tests.

| Folder | Module | Runs against | Config |
|---|---|---|---|
| `editor/` | V3 editor (canvas, panels, save, Listing panel, deep links, property handoff) | Vite only, API mocked in-spec | `e2e/editor/playwright.config.ts` (or `e2e/mocked.config.ts`) |
| `editor/real-backend/` | V3 editor against the running local stack | `npm run dev` on :5000 + `.agent-logs/real-backend/` | `e2e/editor/real-backend/playwright.config.ts` |
| `workspace/` | Workspace shell, navigation, account menu, V3 theme, unsaved-work guard | Vite only, mocked | `e2e/mocked.config.ts` |
| `listings/` | Library, New property, detail, photos, marketing assets, Create design | Vite only, mocked | `e2e/mocked.config.ts` |
| `agent-brand/` | Saved Agent & Brand profile | Vite only, mocked | `e2e/mocked.config.ts` |
| `settings/` | Settings dialog (`#settings/<tab>`): open/close/history, search, Account, Billing, Usage, Team, Appearance, Privacy, account menu | Vite only, mocked | `e2e/mocked.config.ts` |
| `editor-legacy/` | Retired legacy editor (`/editor?editor=legacy`) | full stack | `playwright.config.ts` |
| `ai-generation/` | AI chat / compose / generation (still hosted in the legacy editor) | full stack | `playwright.config.ts` |
| `templates/` | Templates page, format picker, save as template | full stack | `playwright.config.ts` |
| `designs/` | My designs page | full stack | `playwright.config.ts` |
| `payments/` | Pricing, checkout, monetization | full stack | `playwright.config.ts` |
| `auth/` | Password reset, auth flows | full stack | `playwright.config.ts` |
| `platform/` | Cross-cutting: design tokens, legal pages, beta mode, cross-browser smoke | full stack | `playwright.config.ts` |

Shared helpers live in `fixtures/`:

- `workspace-api.ts` — in-memory API for the mocked suites (properties with versions and 409s, paginated library, listing profile, property-linked designs, media uploads, `/users/me` profile, plan quotas, usage, organization/team).
- `legacy-editor.ts` — **temporary**. Since 2026-11-17 every `/editor` URL opens V3. Specs written for the old editor import `test` from here so their navigations go to `/editor?editor=legacy`. Delete it together with `EditorLayout`; any spec that still imports it must then be rewritten for V3 or removed.

## Commands

```bash
npm run test:module -- listings              # unit (client + api) then E2E for one module
npm run test:module -- listings --e2e        # E2E only
npm run test:module -- editor workspace --unit
npm run test:changed                         # every module touched since main (unit + E2E)
npm run test:changed:unit                    # same, unit only
npm run test:modules:list                    # module → test locations
npm run test:e2e:mocked                      # all mocked suites (editor, workspace, listings, agent-brand, settings)
npx playwright test -c e2e/mocked.config.ts listings/   # plain Playwright, one folder
```

The module map is `scripts/test-modules.mjs`. Adding a module means adding an entry there, an `e2e/<module>/` folder, and a unit-test folder (`client/src/features/<module>/__tests__/`, `api/tests/<module>/`).

> Full-stack suites read `PLAYWRIGHT_BASE_URL` from `.env`, which may point at staging. Set it explicitly (for example `PLAYWRIGHT_BASE_URL=http://localhost:5000`) when you mean to test locally.
