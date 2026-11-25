import React, { useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import './v3-save-dialog.css';

export type V3SaveAction = 'design' | 'copy' | 'template';
export interface V3SaveValues { name: string; tags: string[]; category: string; alsoSaveOriginal: boolean }
export interface V3SaveDialogProps {
  action: V3SaveAction;
  initialName: string;
  initialTags: string[];
  initialCategory: string;
  sourceHasChanges: boolean;
  hasSourceId: boolean;
  pendingUpdates: number;
  onClose(): void;
  onSubmit(values: V3SaveValues): Promise<void>;
}
const categories = [
  ['real-estate', 'Real Estate — General'], ['real-estate-listing', 'Real Estate — Property Listing'],
  ['real-estate-market', 'Real Estate — Market Report'], ['real-estate-luxury', 'Real Estate — Luxury'],
  ['real-estate-commercial', 'Real Estate — Commercial'], ['business', 'Business'], ['marketing', 'Marketing'],
  ['education', 'Education'], ['healthcare', 'Healthcare'], ['technology', 'Technology'],
];

export function V3SaveDialog(props: V3SaveDialogProps) {
  const { action } = props;
  const [name, setName] = useState(props.initialName);
  const [tags, setTags] = useState(props.initialTags);
  const [category, setCategory] = useState(props.initialCategory);
  const [tag, setTag] = useState('');
  const [tagError, setTagError] = useState('');
  const [alsoSaveOriginal, setAlsoSaveOriginal] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  const nameInput = useRef<HTMLInputElement>(null);
  const isTemplate = action === 'template';
  const title = isTemplate ? 'Create reusable template' : action === 'copy' ? 'Save a copy' : 'Save design';
  const addTag = () => {
    const value = tag.trim();
    if (!value) return true;
    if (value.length > 20) { setTagError('Use 20 characters or fewer per tag.'); return false; }
    if (tags.some(existing => existing.toLowerCase() === value.toLowerCase())) { setTag(''); setTagError(''); return true; }
    if (tags.length >= 5) { setTagError('Use up to 5 tags.'); return false; }
    setTags([...tags, value]); setTag(''); setTagError(''); return true;
  };
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || name.trim().length > 50 || submitting.current) return;
    let submittedTags = tags;
    if (tag.trim()) {
      const value = tag.trim();
      if (!addTag()) return;
      if (!tags.some(existing => existing.toLowerCase() === value.toLowerCase())) submittedTags = [...tags, value];
    }
    submitting.current = true; setPending(true); setError('');
    try { await props.onSubmit({ name: name.trim(), tags: submittedTags, category, alsoSaveOriginal }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to save. Your edits stay.'); }
    finally { submitting.current = false; setPending(false); }
  }
  return <Dialog.Root open onOpenChange={open => { if (!open && !submitting.current) props.onClose(); }}>
    <Dialog.Portal container={document.querySelector<HTMLElement>('.v3-editor')}>
      <Dialog.Overlay className="v3-save-overlay"/>
      <Dialog.Content className="v3-save-dialog" onOpenAutoFocus={event => { event.preventDefault(); nameInput.current?.focus(); nameInput.current?.select(); }} onCloseAutoFocus={event => { event.preventDefault(); const editor = document.querySelector('.v3-editor'); setTimeout(() => { if (editor?.isConnected) editor.querySelector<HTMLElement>(`button[aria-label="${action === 'design' ? 'Save' : 'Save options'}"]`)?.focus(); }, 0); }} onEscapeKeyDown={event => { if (submitting.current) event.preventDefault(); }} onPointerDownOutside={event => event.preventDefault()}>
        <div className="v3-save-heading"><div><Dialog.Title>{title}</Dialog.Title><Dialog.Description>{isTemplate ? 'Reuse this layout for other properties.' : action === 'copy' ? 'Create a separate Design from this artwork.' : 'Keep this artwork in My Designs.'}</Dialog.Description></div><button type="button" aria-label="Close save dialog" disabled={pending} onClick={props.onClose}><X/></button></div>
        <form onSubmit={submit}>
          <div className="v3-save-body">
            <label>{isTemplate ? 'Template name' : 'Design name'}<input ref={nameInput} maxLength={50} aria-label={isTemplate ? 'Template name' : 'Design name'} value={name} disabled={pending} onChange={event => setName(event.target.value)}/></label>{name.length >= 40 && <p>{name.length}/50 characters</p>}
            {isTemplate && <><div className="v3-save-explanation">Keeps layout, styling and field links.<br/>Clears linked listing facts and photos.</div><p>Independent text and images stay in the layout. Review them before reusing the template.</p></>}
            <details><summary>{isTemplate ? 'Category and tags (optional)' : 'Tags (optional)'}</summary>
              {isTemplate && <label>Category<select aria-label="Category" value={category} disabled={pending} onChange={event => setCategory(event.target.value)}>{!categories.some(([value]) => value === category) && <option value={category}>{category || 'General'}</option>}{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>}
              <div className="v3-save-tags">{tags.map(value => <span key={value}>{value}<button type="button" aria-label={`Remove tag ${value}`} disabled={pending} onClick={() => setTags(tags.filter(item => item !== value))}><X/></button></span>)}</div>
              <div className="v3-save-add-tag"><input aria-label="Add a tag" value={tag} disabled={pending} placeholder="Add a tag…" onChange={event => { setTag(event.target.value); setTagError(''); }} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addTag(); } }}/><button type="button" disabled={pending || !tag.trim()} onClick={addTag}>Add tag</button></div><p>Up to 5 tags · 20 characters each</p>{tagError && <p role="alert">{tagError}</p>}
            </details>
            {!isTemplate && <p>{props.pendingUpdates ? `Includes ${props.pendingUpdates} pending listing ${props.pendingUpdates === 1 ? 'update' : 'updates'}. Apply them from Listing to update the artwork.` : 'Saves the current artwork and listing draft.'}</p>}
            {action === 'copy' && (props.hasSourceId ? <>{props.sourceHasChanges && <div className="v3-save-explanation"><p>Your unsaved edits will be in the new copy. The original keeps its last saved version.</p><label className="v3-save-consent"><input type="checkbox" checked={alsoSaveOriginal} disabled={pending} onChange={event => setAlsoSaveOriginal(event.target.checked)}/>Also save these changes to the original</label></div>}<p>You'll continue editing the new copy.</p></> : <p>Creates a saved Design from this draft.</p>)}
            {error && <p role="alert" className="v3-save-error">{error}</p>}
          </div>
          <div className="v3-save-actions"><button type="button" disabled={pending} onClick={props.onClose}>Cancel</button><button type="submit" className="v3-save-primary" disabled={!name.trim() || name.trim().length > 50 || pending}>{pending ? isTemplate ? 'Creating template…' : 'Saving…' : error ? isTemplate ? 'Retry creation' : 'Retry save' : isTemplate ? 'Create template' : title}</button></div>
          <span className="sr-only" role="status">{pending ? 'Saving. Please wait.' : ''}</span>
        </form>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
