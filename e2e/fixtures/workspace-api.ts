import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Page, Route } from '@playwright/test';

/**
 * In-memory API for mocked workspace / listings / agent-brand / editor-handoff specs (Vite only, no backend).
 * Mirrors the real contracts: org-scoped properties with optimistic versions (409 on stale expectedVersion), the
 * paginated library (cursor over updatedAt desc, id desc), per-user listing profile (version 0 when unsaved),
 * property-linked designs and R2 media uploads. Every request is recorded in `state.requests`.
 */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const PNG = fs.readFileSync(path.join(root, 'e2e', 'fixtures', 'replacement-red.png'));
export const CDN = 'https://cdn.example.test';

export type Listing = {
  property: { name: string; headline: string; address: string; description: string; type: string; country: string; currency: string; amount: string | null; transaction: 'sale' | 'rent'; rentalPeriod: 'month' | 'week' | 'year' | 'day'; beds: string; baths: string; area: string; areaUnit: string; status: string; features: string[] };
  agent: { name: string; phone: string; email: string; agency: string; license: string; photo: string };
  brand: { name: string; logo: string; tagline: string; accent: string };
  photos: { id: string; name: string; src: string }[];
};
export interface SavedProperty { id: string; version: number; record: Listing; createdAt: string; updatedAt: string }
export interface DesignSummary { id: string; name: string; thumbnail: string | null; createdAt: string; updatedAt: string }

export function emptyListing(): Listing {
  return {
    property: { name: '', headline: '', address: '', description: '', type: '', country: 'IN', currency: 'INR', amount: null, transaction: 'sale', rentalPeriod: 'month', beds: '', baths: '', area: '', areaUnit: 'sq ft', status: '', features: [] },
    agent: { name: '', phone: '', email: '', agency: '', license: '', photo: '' },
    brand: { name: '', logo: '', tagline: '', accent: '' }, photos: [],
  };
}
export const cuid = (n: number) => `c${String(n).padStart(24, '0')}`;
export function property(n: number, patch: (record: Listing) => void = () => {}): SavedProperty {
  const record = emptyListing();
  record.property = { ...record.property, name: `Lakeview ${n}`, address: `${n} Lake Road, Mumbai`, amount: '8000000', status: 'For sale', beds: '3', baths: '2', area: '1200' };
  record.agent = { ...record.agent, name: 'Saved Agent', agency: 'Saved Agency' };
  patch(record);
  const updatedAt = new Date(Date.UTC(2026, 10, 1) + n * 60_000).toISOString();
  return { id: cuid(n), version: 1, record, createdAt: updatedAt, updatedAt };
}

export interface WorkspaceState {
  properties: SavedProperty[];
  profile: { version: number; record: Pick<Listing, 'agent' | 'brand'> };
  designs: Record<string, DesignSummary[]>;
  requests: { method: string; path: string; search: string; body?: any }[];
  failLibrary: number;
  uploads: number;
  /** GET/PATCH /users/me (Settings → Account). */
  account: AccountProfile;
  /** Number of upcoming PATCH /users/me calls to fail with 500. */
  failProfileSave: number;
  /** Bump a property's version behind the page's back to simulate another editor. */
  bump: (id: string) => void;
}

export interface AccountProfile { id: string; email: string; name: string | null; avatarUrl: string | null; hasPassword: boolean; hasGoogle: boolean; emailVerified: boolean; organizationId: string | null; createdAt: string }
export interface PlanFixture { tier: string; design: { current: number; limit: number }; editable: { used: number; limit: number } }
export interface PaymentFixture { id: string; amount: number; currency: string; status: string; method: string | null; externalPaymentId: string | null; createdAt: string }
export interface TeamFixture { name: string; userLimit: number; members: { id: string; email: string; name: string | null }[] }

const encode = (p: SavedProperty) => Buffer.from(`${p.updatedAt}|${p.id}`).toString('base64url');
function summary(p: SavedProperty, designs: number) {
  const r = p.record.property;
  return { id: p.id, version: p.version, name: r.name, address: r.address, status: r.status, transaction: r.transaction, currency: r.currency, amount: r.amount, rentalPeriod: r.rentalPeriod, country: r.country,
    beds: r.beds, baths: r.baths, area: r.area, areaUnit: r.areaUnit, coverUrl: p.record.photos.find(photo => photo.src.startsWith('https://'))?.src ?? null, photoCount: p.record.photos.length, designCount: designs, updatedAt: p.updatedAt };
}

export async function mockWorkspace(page: Page, options: { properties?: SavedProperty[]; profile?: WorkspaceState['profile']; designs?: Record<string, DesignSummary[]>; theme?: 'light' | 'dark'; user?: { id: string; name: string; email: string }; account?: Partial<AccountProfile>; plan?: PlanFixture; team?: TeamFixture; payments?: PaymentFixture[] } = {}): Promise<WorkspaceState> {
  const user = options.user ?? { id: 'user-ws', name: 'Dana Account', email: 'dana@account.test' };
  await page.addInitScript(({ user, theme }) => {
    localStorage.setItem('auth_token', 'workspace-fixture');
    localStorage.setItem('auth_user', JSON.stringify(user));
    localStorage.setItem('theme', theme);
  }, { user, theme: options.theme ?? 'light' });
  const state: WorkspaceState = {
    properties: options.properties ?? [],
    profile: options.profile ?? { version: 0, record: { agent: emptyListing().agent, brand: emptyListing().brand } },
    designs: options.designs ?? {},
    requests: [], failLibrary: 0, uploads: 0, failProfileSave: 0,
    account: { id: user.id, email: user.email, name: user.name, avatarUrl: null, hasPassword: true, hasGoogle: false, emailVerified: true, organizationId: 'org-ws', createdAt: '2026-10-01T00:00:00.000Z', ...options.account },
    bump: id => { const target = state.properties.find(p => p.id === id); if (target) target.version++; },
  };
  await page.route(`${CDN}/**`, route => route.fulfill({ status: 200, contentType: 'image/png', body: PNG }));
  await page.route('**/api/**', async (route: Route) => {
    const request = route.request(), url = new URL(request.url()), pathname = url.pathname.replace(/^\/api(?:\/v1)?/, ''), method = request.method();
    let body: any;
    try { body = request.postDataJSON(); } catch { body = undefined; }
    if (request.headers()['content-type']?.startsWith('multipart/form-data')) {
      const envelope = new Request('http://workspace.test', { method: 'POST', headers: { 'Content-Type': request.headers()['content-type'] }, body: request.postDataBuffer()! });
      const form = await envelope.formData();
      if (form.has('payload')) {
        // Property save with draft photos: a JSON `payload` part plus one file part per `draft:<field>` reference.
        body = JSON.parse(String(form.get('payload')));
        const replace = (src: string) => { if (!src.startsWith('draft:')) return src; if (!form.has(src.slice(6))) throw new Error('Missing draft upload'); state.uploads++; return `${CDN}/upload-${state.uploads}.png`; };
        body.record.agent.photo = replace(body.record.agent.photo); body.record.brand.logo = replace(body.record.brand.logo);
        if (body.record.photos) body.record.photos = body.record.photos.map((photo: any) => ({ ...photo, src: replace(photo.src) }));
      } else {
        // Plain media upload (POST /media): a single `file` part, answered by the /media handler below.
        const file = form.get('file');
        body = { file: file instanceof File ? file.name : null };
      }
    }
    state.requests.push({ method, path: pathname, search: url.search, body });
    const json = (value: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(value) });
    const now = () => new Date(Date.UTC(2026, 10, 17) + state.requests.length * 1000).toISOString();

    if (pathname === '/properties/library') {
      if (state.failLibrary > 0) { state.failLibrary--; return json({ message: 'Unavailable' }, 503); }
      const term = (url.searchParams.get('search') ?? '').toLowerCase(), limit = Number(url.searchParams.get('limit') ?? 24), cursor = url.searchParams.get('cursor');
      const sorted = state.properties.filter(p => !term || [p.id, p.record.property.name, p.record.property.address].some(v => v.toLowerCase().includes(term)))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || b.id.localeCompare(a.id));
      const start = cursor ? sorted.findIndex(p => encode(p) === cursor) + 1 : 0;
      const items = sorted.slice(start, start + limit);
      return json({ items: items.map(p => summary(p, state.designs[p.id]?.length ?? 0)), nextCursor: start + limit < sorted.length ? encode(items[items.length - 1]) : null });
    }
    const designs = pathname.match(/^\/properties\/([^/]+)\/designs$/);
    if (designs) {
      if (!state.properties.some(p => p.id === designs[1])) return json({ message: 'Property not found' }, 404);
      const all = state.designs[designs[1]] ?? [];
      const limit = Number(url.searchParams.get('limit') ?? 24), start = Number(url.searchParams.get('cursor') ?? 0);
      const items = all.slice(start, start + limit);
      return json({ items, total: all.length, nextCursor: start + limit < all.length ? String(start + limit) : null });
    }
    const one = pathname.match(/^\/properties\/([^/]+)$/);
    if (one) {
      const index = state.properties.findIndex(p => p.id === one[1]);
      if (index < 0) return json({ message: 'Property not found' }, 404);
      if (method === 'PUT') {
        if (body.expectedVersion !== state.properties[index].version) return json({ message: 'Property changed. Reload the saved property before saving again.' }, 409);
        state.properties[index] = { ...state.properties[index], record: body.record, version: state.properties[index].version + 1, updatedAt: now() };
      }
      return json(state.properties[index]);
    }
    if (pathname === '/properties') {
      if (method === 'POST') { const created = { id: cuid(900 + state.properties.length), version: 1, record: body.record, createdAt: now(), updatedAt: now() }; state.properties.push(created); return json(created, 201); }
      return json(state.properties.slice(0, 50));
    }
    if (pathname === '/listing-profiles') {
      if (method === 'PUT') {
        if (body.expectedVersion !== state.profile.version) return json({ message: 'Profile changed. Reload before saving again.' }, 409);
        state.profile = { version: state.profile.version + 1, record: body.record };
      }
      return json(state.profile);
    }
    if (pathname === '/media' && method === 'POST') { state.uploads++; return json({ url: `${CDN}/upload-${state.uploads}.png` }, 201); }
    if (pathname === '/users/me') {
      if (method === 'PATCH') {
        if (state.failProfileSave > 0) { state.failProfileSave--; return json({ message: 'Your profile could not be saved.' }, 500); }
        if (typeof body.name === 'string') state.account.name = body.name.trim();
        if (body.avatarUrl !== undefined) state.account.avatarUrl = body.avatarUrl;
      }
      return json({ data: state.account });
    }
    if (pathname === '/auth/forgot-password' && method === 'POST') return json({ message: 'If an account exists, a reset link has been sent.' });
    const plan = options.plan;
    if (pathname === '/infographics/generations/usage/quota') return json(plan ? { organizationId: 'org-ws', planTier: plan.tier, current: plan.design.current, limit: plan.design.limit, remaining: plan.design.limit - plan.design.current } : {});
    if (pathname === '/infographics/generations/usage/quota/editable') return json(plan ? { organizationId: 'org-ws', planTier: plan.tier, editableUsed: plan.editable.used, editableLimit: plan.editable.limit, editableRemaining: plan.editable.limit - plan.editable.used } : {});
    if (pathname === '/payments/subscription') return json(plan ? { subscription: { id: 'sub-ws', planTier: plan.tier, status: 'ACTIVE', currentPeriodEnd: '2026-12-17T00:00:00.000Z', cancelAtPeriodEnd: false }, usage: { current: plan.design.current, limit: plan.design.limit } } : { subscription: null });
    if (pathname === '/payments/history') return json({ payments: options.payments ?? [] });
    if (pathname === '/payments/usage/monthly') return json({ data: plan ? [{ month: 'Oct 2026', count: 4, costUsd: 0.1 }, { month: 'Nov 2026', count: plan.design.current, costUsd: 0.2 }] : [] });
    if (pathname === '/payments/usage/history') return json({ data: plan ? [{ date: '2026-11-16T09:30:00.000Z', count: 1, costUsd: 0.08, aiModel: 'ideogram-4' }] : [] });
    if (pathname === '/payments/usage/export') return route.fulfill({ status: 200, contentType: 'text/csv', body: ['date,count', '2026-11-16,1', ''].join('\n') });
    if (pathname === '/users/organization') {
      const team = options.team;
      return json({ data: team ? { organization: { id: 'org-ws', name: team.name, planTier: plan?.tier ?? 'TEAM', monthlyLimit: plan?.design.limit ?? 200 }, userSlots: { current: team.members.length, limit: team.userLimit, remaining: team.userLimit - team.members.length }, planLimits: { userLimit: team.userLimit, monthlyLimit: plan?.design.limit ?? 200 } } : null });
    }
    const memberDelete = pathname.match(/^\/users\/organization\/members\/([^/]+)$/);
    if (memberDelete && method === 'DELETE' && options.team) { options.team.members = options.team.members.filter(member => member.id !== memberDelete[1]); return json({ success: true }); }
    if (pathname === '/users/organization/members/invite' && method === 'POST' && options.team) {
      if (body.email === 'nobody@example.test') return json({ message: 'No account found for that email.' }, 404);
      options.team.members.push({ id: `u${options.team.members.length + 1}`, email: body.email, name: null }); return json({ success: true });
    }
    if (pathname === '/users/organization/members') return json({ data: (options.team?.members ?? []).map(member => ({ ...member, createdAt: '2026-10-01T00:00:00.000Z' })) });
    if (pathname === '/users/organization/slots') { const team = options.team; return json({ data: team ? { current: team.members.length, limit: team.userLimit, remaining: team.userLimit - team.members.length } : { current: 1, limit: 1, remaining: 0 } }); }
    if (pathname.startsWith('/payments/usage') || pathname.startsWith('/payments/subscription') || pathname.includes('/usage/quota')) return json({});
    return json([]);
  });
  return state;
}

/** A small valid PNG to upload through file inputs. */
export const uploadFile = (name = 'front.png') => ({ name, mimeType: 'image/png', buffer: PNG });
