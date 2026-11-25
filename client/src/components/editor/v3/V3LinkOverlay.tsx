import { useCanvasStore } from '../../../hooks/useCanvasStore';
import { useV3ListingWorkflow } from '../../../hooks/useV3ListingWorkflow';
import { V3_SLOT_CATALOG } from '../../../lib/v3ListingWorkflow';

const GROUPS: Record<string, string> = { property: 'Property', agent: 'Agent', brand: 'Brand' };

/** Friendly "Group · Field" label for a canonical slot, e.g. property.price → "Property · Price", agent.photo → "Agent · Photo". */
export function linkLabel(slot: string): string {
  const [prefix] = slot.split('.');
  const group = GROUPS[prefix] ?? 'Field';
  const known = V3_SLOT_CATALOG.find(item => item.slot === slot || (slot === 'property.facts' && item.slot === 'property.specs'))?.label ?? slot.split('.').slice(1).join(' ');
  const field = known.replace(new RegExp(`^${group}\\s+`, 'i'), '');
  return `${group} · ${field.charAt(0).toUpperCase()}${field.slice(1)}`;
}

/**
 * Editor-only overlay that outlines linked and customized text/image elements. It is rendered inside the scaled
 * artboard (so it follows zoom, pan and scroll), ignores pointer input, never writes to the design and is not part of
 * the store-based PNG/thumbnail renderer. It deliberately avoids `data-element-id`, which selection, toolbar
 * positioning and export-review overflow checks query.
 */
export function V3LinkOverlay({ zoom }: { zoom: number }) {
  const elements = useCanvasStore(state => state.elements);
  const { bindings, overrides } = useV3ListingWorkflow();
  const scale = 1 / Math.max(zoom, 0.05);
  const marks = elements.filter(element => element.visible && (element.type === 'text' || element.type === 'image')).flatMap(element => {
    const slot = bindings[element.id]?.slot;
    const custom = Object.prototype.hasOwnProperty.call(overrides, element.id);
    if (!slot && !custom) return [];
    return [{ element, custom, label: slot ? linkLabel(slot) : 'Custom value' }];
  });
  return <div className="v3-link-overlay" aria-hidden="true" data-testid="link-overlay" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 99990 }}>
    {marks.map(({ element, custom, label }) => <div key={element.id} className={`v3-link-mark${custom ? ' v3-link-mark-custom' : ''}`} data-link-for={element.id}
      style={{ position: 'absolute', left: element.x, top: element.y, width: element.width, height: element.height, transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined, transformOrigin: 'center', outlineWidth: 1.5 * scale, outlineOffset: 2 * scale }}>
      <span className="v3-link-badge" style={{ fontSize: 10 * scale, padding: `${2 * scale}px ${5 * scale}px`, borderRadius: 4 * scale, top: -18 * scale }}>{custom ? `Custom · ${slotFree(label)}` : label}</span>
    </div>)}
  </div>;
}
const slotFree = (label: string) => label === 'Custom value' ? 'Independent value' : label.split(' · ').slice(1).join(' · ');
