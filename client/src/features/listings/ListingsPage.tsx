import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import { ArrowRight, Building2, ImageOff, Plus, RotateCcw, Search, X } from 'lucide-react';
import { PageHeading } from '@/features/workspace/PageHeading';
import { Input } from '@/components/ui/input';
import { usePropertyLibrary, type SavedPropertySummary } from './listingsApi';
import { summaryPrice, summarySpecs } from './listingFormat';
import './listings.css';

const SCROLL_KEY = 'ws-listings-scroll';
const readScroll = () => { try { return JSON.parse(sessionStorage.getItem(SCROLL_KEY) ?? 'null') as { q: string; y: number } | null; } catch { return null; } };
const writeScroll = (value: { q: string; y: number }) => { try { sessionStorage.setItem(SCROLL_KEY, JSON.stringify(value)); } catch { /* storage unavailable */ } };

/** Listing library (rev-2 spec §5): search kept in the URL (?q=), 300 ms debounce, cursor pagination. */
export default function ListingsPage() {
  const search = useSearch();
  const [location, navigate] = useLocation();
  const urlTerm = new URLSearchParams(search).get('q') ?? '';
  const [input, setInput] = useState(urlTerm);
  const searchBox = useRef<HTMLInputElement>(null);

  useEffect(() => { setInput(urlTerm); }, [urlTerm]);
  useEffect(() => {
    if (input.trim() === urlTerm) return;
    const timer = window.setTimeout(() => {
      const term = input.trim().slice(0, 200);
      navigate(term ? `${location}?q=${encodeURIComponent(term)}` : location, { replace: true });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [input, urlTerm, location, navigate]);

  const library = usePropertyLibrary(urlTerm);
  const items = library.data?.pages.flatMap(page => page.items) ?? [];

  // Return navigation restores the scroll position for the same search.
  const restored = useRef(false);
  useLayoutEffect(() => {
    if (restored.current || !library.isSuccess) return;
    restored.current = true;
    const saved = readScroll();
    if (saved && saved.q === urlTerm) window.scrollTo(0, saved.y);
  }, [library.isSuccess, urlTerm]);

  const clear = () => { setInput(''); navigate(location, { replace: true }); searchBox.current?.focus(); };

  return (
    <>
      <PageHeading crumbs={[{ label: 'Listings' }]} eyebrow="Your listing library" title="Good marketing starts with one listing."
        subtitle="Enter the details once. Reuse them for every asset and every milestone."
        actions={<Link href="/listings/new" className="ws-btn ws-btn-primary"><Plus aria-hidden="true" />New property</Link>} />

      <div className="lst-search ws-search" role="search">
        <Search className="lst-search-icon" aria-hidden="true" />
        <label htmlFor="lst-search" className="ws-sr-only">Search properties by name, address or ID</label>
        <Input id="lst-search" className="ws-search-input" ref={searchBox} type="search" value={input} maxLength={200} placeholder="Search by name, address or property ID" onChange={event => setInput(event.target.value)} />
        {input && <button type="button" className="lst-search-clear" aria-label="Clear search" onClick={clear}><X aria-hidden="true" /></button>}
      </div>

      {library.isPending ? (
        <div className="lst-grid" aria-busy="true" aria-label="Loading properties">
          {Array.from({ length: 6 }, (_, index) => <div key={index} className="ws-panel lst-card"><div className="ws-skeleton lst-card-cover" /><div className="ws-panel-body"><div className="ws-skeleton" style={{ height: 18, width: '70%' }} /><div className="ws-skeleton" style={{ height: 14, width: '90%', marginTop: 10 }} /></div></div>)}
        </div>
      ) : library.isError ? (
        <div className="ws-alert ws-alert-error" role="alert">
          <span>Your properties could not be loaded. Check your connection and try again.</span>
          <button type="button" className="ws-btn" onClick={() => void library.refetch()}><RotateCcw aria-hidden="true" />Retry</button>
        </div>
      ) : items.length === 0 ? (
        urlTerm ? (
          <div className="ws-empty"><Search aria-hidden="true" /><h2>No properties match “{urlTerm}”</h2><p>Try a different name, address or property ID.</p><button type="button" className="ws-btn" onClick={clear}>Clear search</button></div>
        ) : (
          <div className="ws-empty"><Building2 aria-hidden="true" /><h2>No properties yet</h2><p>Add your first property to start creating designs from it.</p><Link href="/listings/new" className="ws-btn ws-btn-primary"><Plus aria-hidden="true" />New property</Link></div>
        )
      ) : (
        <>
          <p className="lst-count" aria-live="polite">{urlTerm ? `${items.length}${library.hasNextPage ? '+' : ''} ${items.length === 1 ? 'result' : 'results'} for “${urlTerm}”` : `${items.length}${library.hasNextPage ? '+' : ''} ${items.length === 1 ? 'property' : 'properties'}`}</p>
          <ul className="lst-grid">
            {items.map(item => <li key={item.id}><PropertyCard item={item} onOpen={() => writeScroll({ q: urlTerm, y: window.scrollY })} /></li>)}
          </ul>
          {library.hasNextPage && (
            <div className="lst-more">
              <button type="button" className="ws-btn" disabled={library.isFetchingNextPage} onClick={() => void library.fetchNextPage()}>{library.isFetchingNextPage ? 'Loading…' : 'Load more properties'}</button>
            </div>
          )}
          {library.isFetchNextPageError && <p className="ws-field-error" role="alert">More properties could not be loaded. Try again.</p>}
        </>
      )}
    </>
  );
}

function PropertyCard({ item, onOpen }: { item: SavedPropertySummary; onOpen: () => void }) {
  const [broken, setBroken] = useState(false);
  const price = summaryPrice(item), specs = summarySpecs(item);
  const title = item.name.trim() || item.address.trim() || 'Untitled property';
  return (
    <Link href={`/listings/${encodeURIComponent(item.id)}`} className="ws-panel lst-card" onClick={onOpen} data-testid="property-card">
      {item.coverUrl && !broken ? (
        <img className="lst-card-cover" src={item.coverUrl} alt="" loading="lazy" onError={() => setBroken(true)} />
      ) : (
        <div className="lst-card-cover lst-placeholder" role="img" aria-label={item.coverUrl ? 'Photo unavailable' : 'No property photos'}><ImageOff aria-hidden="true" /><span>{item.coverUrl ? 'Photo unavailable' : 'No property photos'}</span></div>
      )}
      <div className="ws-panel-body">
        <span className="ws-pill ws-pill-green">{item.status || (item.transaction === 'rent' ? 'For rent' : 'For sale')}</span>
        <h2 className="lst-card-title">{title}</h2>
        {item.address && item.address !== title && <p className="lst-card-address">{item.address}</p>}
        {price ? <strong className="lst-card-price">{price}</strong> : <span className="lst-card-price lst-card-price-missing">Price not set</span>}
        {specs && <p className="lst-card-specs">{specs}</p>}
        <div className="lst-card-foot">
          <span>{typeof item.designCount === 'number' ? `${item.designCount} ${item.designCount === 1 ? 'design' : 'designs'} · ` : ''}{item.photoCount} {item.photoCount === 1 ? 'photo' : 'photos'}</span>
          <span className="ws-text-button" aria-hidden="true">Open listing <ArrowRight /></span>
        </div>
      </div>
    </Link>
  );
}
