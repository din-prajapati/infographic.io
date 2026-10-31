import { useState } from 'react';
import { useCanvasStore } from '../../../hooks/useCanvasStore';
import type { TextElement } from '../../../lib/canvasTypes';
import { commitEdit } from '../../canvas/TextElement';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';

function TextDraft({ element }: { element: TextElement }) {
  const [draft, setDraft] = useState(element.content);
  const updateElement = useCanvasStore(state => state.updateElement);
  return <div className="space-y-4">
    <label className="block space-y-2 text-sm font-medium">Text content
      <Textarea value={draft} onChange={event => setDraft(event.target.value)} rows={7} disabled={element.locked} />
    </label>
    <Button className="w-full bg-foreground text-background hover:bg-foreground/90" disabled={element.locked || draft === element.content} onClick={() => commitEdit(updateElement, element, draft)}>Apply text</Button>
    <p className="text-xs leading-relaxed text-foreground">Changes stay in this draft until you apply them. Undo restores the previous text.</p>
  </div>;
}

export function V3TextInspector() {
  const { elements, selectedElementIds, selectElement } = useCanvasStore();
  const textElements = elements.filter((element): element is TextElement => element.type === 'text');
  const selected = textElements.find(element => selectedElementIds.length === 1 && selectedElementIds[0] === element.id);
  return <aside aria-label="Text inspector" className="flex w-80 shrink-0 flex-col border-l border-border bg-card text-card-foreground">
    <div className="border-b border-border px-6 py-4"><h2 className="font-semibold">Text</h2><p className="mt-1 text-xs text-foreground">Edit the words in your design</p></div>
    <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
      {selected ? <TextDraft key={`${selected.id}:${selected.content}`} element={selected} /> : <p className="text-sm leading-relaxed text-foreground">Select a text element to edit its content, or add text from the toolbar.</p>}
      <section aria-label="Text elements" className="space-y-2"><h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">Text elements</h3>
        {textElements.length === 0 && <p className="text-sm text-foreground">No text yet.</p>}
        {textElements.map(element => <button key={element.id} disabled={element.locked || !element.visible} aria-pressed={selected?.id === element.id}
          className="block w-full truncate rounded-md border border-border px-3 py-2 text-left text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          onClick={() => selectElement(element.id)}>{element.content || element.name || 'Empty text'}</button>)}
      </section>
    </div>
    <p className="border-t border-border px-6 py-4 text-xs text-foreground">Apply text, then Save to keep your changes.</p>
  </aside>;
}
