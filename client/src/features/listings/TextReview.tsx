import { useState } from 'react';
import { ClipboardPaste, Sparkles } from 'lucide-react';
import { applyReviewedFacts, reviewListingText, type ListingRecord, type ListingTextReview, type ReviewedFact } from '@shared/listingWorkflow';
import { SAMPLE_SELLER_MESSAGE } from './listingFormat';

const display = (fact: ReviewedFact) => Array.isArray(fact.value) ? fact.value.join(', ') : fact.value ?? '—';

/**
 * Paste-text intake (rev-2 spec §5). Uses the shared reviewed-extraction logic (reviewListingText / applyReviewedFacts)
 * that the V3 Listing panel uses. Nothing is applied until the user selects facts; Agent details are suggestions only
 * and start unselected; ambiguous facts need an explicit choice. Applying fills the form — it does not save.
 */
export function TextReview({ draft, onApply }: { draft: ListingRecord; onApply: (record: ListingRecord, appliedCount: number) => void }) {
  const [source, setSource] = useState('');
  const [usingExample, setUsingExample] = useState(false);
  const [review, setReview] = useState<ListingTextReview | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const extract = () => {
    const next = reviewListingText(source, draft);
    setReview(next); setError(next.rejected ? next.error ?? 'This text could not be read.' : null);
    setSelected(next.facts.filter(fact => fact.selected).map(fact => fact.id));
  };
  const toggle = (fact: ReviewedFact, on: boolean) => {
    setSelected(current => {
      // One candidate per field: choosing an ambiguous candidate unselects its siblings.
      const others = current.filter(id => id !== fact.id && !(on && review?.facts.find(f => f.id === id)?.path === fact.path));
      return on ? [...others, fact.id] : others;
    });
  };
  const apply = () => {
    if (!review) return;
    const result = applyReviewedFacts(draft, review, selected);
    if (!result.ok) { setError(result.error); return; }
    onApply(result.record, selected.length);
    setReview(null); setSelected([]);
  };

  return (
    <div className="ws-panel">
      <div className="ws-panel-head"><div><h2>Paste the seller’s message</h2><p>We find the facts and show where each one came from. You choose what goes into the form.</p></div></div>
      <div className="ws-panel-body">
      <div className="ws-field">
        <div className="ws-field-row">
          <label htmlFor="lst-paste">Seller or WhatsApp message</label>
          <span className="ws-counter">{source.length}/50000</span>
        </div>
        <textarea id="lst-paste" value={source} maxLength={50000} rows={8} placeholder="Paste one property’s details here…" onChange={event => { setSource(event.target.value); setUsingExample(false); setReview(null); }} />
        {usingExample && <span className="ws-hint" role="status">Example message — nothing is saved until you create the property.</span>}
      </div>
      <div className="lst-row" style={{ marginTop: 12 }}>
        <button type="button" className="ws-btn" onClick={() => { setSource(SAMPLE_SELLER_MESSAGE); setUsingExample(true); setReview(null); setError(null); }}><ClipboardPaste aria-hidden="true" />Use example</button>
        <button type="button" className="ws-btn ws-btn-primary" disabled={!source.trim()} onClick={extract}><Sparkles aria-hidden="true" />Extract &amp; review</button>
      </div>
      {error && <p className="ws-alert ws-alert-error" role="alert" style={{ marginTop: 16 }}>{error}</p>}
      {review && !review.rejected && review.facts.length > 0 && (
        <section aria-labelledby="lst-review-title" style={{ marginTop: 20 }}>
          <h3 id="lst-review-title" style={{ margin: '0 0 4px', fontSize: 15 }}>Review what we found</h3>
          <p className="ws-hint">Tick the facts to copy into the form. Agent details are suggestions — your saved Agent &amp; Brand is not changed. Missing facts stay empty.</p>
          <ul className="lst-review">
            {review.facts.map(fact => (
              <li key={fact.id} className="lst-fact" data-ambiguous={fact.ambiguous || undefined}>
                <input type="checkbox" id={`lst-${fact.id}`} checked={selected.includes(fact.id)} onChange={event => toggle(fact, event.target.checked)} />
                <label htmlFor={`lst-${fact.id}`}>
                  <span className="lst-fact-label">{fact.label}{fact.ambiguous && <span className="ws-pill ws-pill-amber" style={{ marginLeft: 8 }}>Choose one</span>}{fact.path.startsWith('agent.') && <span className="ws-pill" style={{ marginLeft: 8 }}>Suggestion</span>}</span>
                  <span className="lst-fact-value" style={{ display: 'block' }}>{display(fact)}</span>
                </label>
                <span className="lst-fact-evidence">Found in: “{fact.evidence}”</span>
              </li>
            ))}
          </ul>
          <div className="lst-row" style={{ marginTop: 14 }}>
            <button type="button" className="ws-btn ws-btn-primary" disabled={!selected.length} onClick={apply}>Copy {selected.length} {selected.length === 1 ? 'fact' : 'facts'} to the form</button>
            <button type="button" className="ws-btn ws-btn-subtle" onClick={() => { setReview(null); setSelected([]); }}>Discard review</button>
          </div>
        </section>
      )}
    </div></div>
  );
}
