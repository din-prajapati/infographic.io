import { Link } from 'wouter';
import { ArrowRight, Sparkles } from 'lucide-react';
import { PageHeading } from './PageHeading';

/**
 * How it works (design.md §15): vertical numbered workflow with source chips and one destination per step.
 * Copy describes what this release does — no simulated agents, campaign jobs or providers.
 */
const STEPS = [
  { label: 'Each listing', title: 'Save the property once', body: 'Paste the seller’s message or type the details. Review what was found, add photos, then save. Price, features and photos live on the property — not inside each design.', tags: ['Paste text', 'Manual entry', 'Photos'], action: { href: '/listings/new', label: 'New property' } },
  { label: 'Once', title: 'Save your Agent & Brand', body: 'Portrait, contact details, logo and accent colour are stored once. New properties start with them; existing properties keep what they were saved with until you choose to update them.', tags: ['Agent → Portrait', 'Brand → Logo', 'Brand → Accent'], action: { href: '/agent-brand', label: 'Open Agent & brand' } },
  { label: 'Each design', title: 'Pick a template', body: 'From a property, choose Create design and pick a template or size. The editor opens with that property ready in the Listing panel.', tags: ['Template fields', 'Property → Price', 'Agent → Phone'], action: { href: '/templates', label: 'View templates' } },
  { label: 'You decide', title: 'Apply, then save the design', body: 'Nothing on the artwork changes until you press Apply to design. Save as Design keeps this marketing asset; Save as Template keeps the layout and its field links for reuse.', tags: ['Apply to design', 'Save as Design', 'Save as Template'] },
  { label: 'Human review', title: 'Update on purpose', body: 'Editing a property or your Agent & Brand never rewrites designs you already saved. Open the design, review the changes in the Listing panel and apply them when you are ready.', tags: ['Review', 'Apply', 'Export'], action: { href: '/my-designs', label: 'Open designs' }, amber: true },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHeading crumbs={[{ label: 'How it works' }]} eyebrow="Repetition, removed. Control, kept." title="One setup. A lighter day, every day."
        subtitle="Keep listing facts in one place and reuse them across every design, without surprise changes to artwork you have already approved." />
      <ol className="ws-steps">
        {STEPS.map((step, index) => (
          <li key={step.title} className="ws-step">
            <span className="ws-step-num" aria-hidden="true">{index + 1}</span>
            <section className="ws-panel" aria-label={`Step ${index + 1}: ${step.title}`}>
              <span className={`ws-pill ${step.amber ? 'ws-pill-amber' : 'ws-pill-green'}`}>{step.label}</span>
              <h2>{step.title}</h2>
              <p>{step.body}</p>
              <div className="ws-flow-tags">{step.tags.map(tag => <span key={tag} className="ws-flow-tag">{tag}</span>)}</div>
              {step.action && <Link href={step.action.href} className="ws-btn ws-btn-small">{step.action.label}<ArrowRight aria-hidden="true" /></Link>}
            </section>
          </li>
        ))}
      </ol>
      <p className="ws-review-tip"><Sparkles aria-hidden="true" />Your edits stay yours: designs change only when you apply an update in the editor.</p>
    </>
  );
}
