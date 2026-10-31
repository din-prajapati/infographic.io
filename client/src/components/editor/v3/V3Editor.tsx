import { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Check, Download, Home, Moon, MousePointer2, Redo2, Save, Sun, Type, Undo2 } from 'lucide-react';
import { useV3DesignSession } from '../../../hooks/useV3DesignSession';
import { useCanvasStore } from '../../../hooks/useCanvasStore';
import { downloadCanvas } from '../../../lib/canvasExport';
import { createTextElement } from '../../../lib/canvasUtils';
import { useTheme } from '../../../lib/theme-provider';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { V3Canvas } from './V3Canvas';
import { V3TextInspector } from './V3TextInspector';

export default function V3Editor({ designId }: { designId?: string }) {
  const session = useV3DesignSession(designId);
  const { undo, redo, history, clearSelection, addElement, selectElement } = useCanvasStore();
  const { resolvedTheme, setTheme } = useTheme();
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'exported' | 'error'>('idle');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const wasPreview = useRef(false);
  const ready = session.ready;
  const save = session.save;

  useEffect(() => { setExportStatus('idle'); setIsPreviewMode(false); }, [designId]);
  useEffect(() => {
    if (isPreviewMode) window.getSelection()?.removeAllRanges();
    if (wasPreview.current && !isPreviewMode) document.querySelector<HTMLButtonElement>('[data-v3-preview-trigger]')?.focus();
    wasPreview.current = isPreviewMode;
  }, [isPreviewMode]);
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isPreviewMode) {
        event.preventDefault(); setIsPreviewMode(false); return;
      }
      const target = event.target;
      if (target instanceof HTMLElement && (target.closest('input, textarea, select') || target.isContentEditable)) return;
      if (ready && event.key.toLowerCase() === 'p' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault(); setIsPreviewMode(value => !value); return;
      }
      if (isPreviewMode) return;
      if (!ready || !(event.ctrlKey || event.metaKey)) return;
      if (event.key.toLowerCase() === 's') { event.preventDefault(); void save(); }
      if (event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? redo() : undo(); }
      if (event.key.toLowerCase() === 'y') { event.preventDefault(); redo(); }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [ready, save, undo, redo, isPreviewMode]);

  async function exportDesign() {
    if (!ready || exportStatus === 'exporting') return;
    setExportStatus('exporting');
    try {
      const success = await downloadCanvas(session.title || 'design', 'png');
      setExportStatus(success ? 'exported' : 'error');
    } catch { setExportStatus('error'); }
  }

  const status = !ready ? session.status === 'loading' || session.status === 'idle' ? 'Opening design' : 'Unable to open design'
    : session.status === 'saving' ? 'Saving…' : session.status === 'saved' ? 'Saved' : 'Unsaved';

  return <div className="fixed inset-0 z-20 flex min-w-[1024px] flex-col bg-background text-foreground">
    {!isPreviewMode && <>
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border px-5">
      <div className="flex shrink-0 items-center gap-2 border-r border-border pr-5"><Home className="h-5 w-5 text-primary" /><span className="font-semibold tracking-tight">Buildographic</span><span className="rounded bg-muted px-2 py-1 text-xs font-semibold text-foreground">V3</span><h1 className="sr-only">V3 Editor</h1></div>
      <Link href="/my-designs" className="flex shrink-0 items-center gap-1 text-sm font-medium hover:underline"><ArrowLeft className="h-4 w-4" />Projects</Link>
      <Input aria-label="Design title" className="min-w-0 max-w-xs flex-1 border-transparent bg-transparent font-medium transition-none hover:border-input focus-visible:border-input" value={session.title} disabled={!ready} onChange={event => session.setTitle(event.target.value)} />
      <span role="status" className="ml-auto whitespace-nowrap text-xs text-foreground">{status}</span>
      <div className="flex gap-1 border-l border-border pl-3">
        <Button variant="ghost" size="icon" aria-label="Undo" disabled={!ready || !history.past.length} onClick={undo}><Undo2 className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" aria-label="Redo" disabled={!ready || !history.future.length} onClick={redo}><Redo2 className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>{resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</Button>
      </div>
      <Button variant="outline" disabled={!ready || session.status === 'saving'} onClick={() => void save()}><Save className="mr-2 h-4 w-4" />Save</Button>
      <Button className="bg-foreground text-background hover:bg-foreground/90" disabled={!ready || exportStatus === 'exporting'} onClick={() => void exportDesign()}><Download className="mr-2 h-4 w-4" />Export</Button>
    </header>
    <nav aria-label="Editing workflow" className="flex h-12 shrink-0 items-center gap-6 border-b border-border bg-card px-6 text-xs text-foreground">
      <span className="mr-auto flex items-center gap-2 font-medium text-foreground"><Check className="h-4 w-4 text-primary" />Your design, one step at a time</span>
      {['Open design', 'Edit text', 'Save changes', 'Export PNG'].map((step, index) => <span key={step} className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full border border-border text-foreground">{index + 1}</span>{step}</span>)}
    </nav>
    </>}
    {isPreviewMode && <Button aria-label="Exit preview" variant="outline" className="absolute right-4 top-4 z-30 gap-2 bg-card text-card-foreground" onClick={() => setIsPreviewMode(false)}><ArrowLeft className="h-4 w-4" />Exit preview<kbd className="rounded border border-border px-1 text-xs">Esc</kbd></Button>}
    {!isPreviewMode && session.error && <div role="alert" className="flex shrink-0 items-center justify-between gap-4 border-b border-destructive/30 bg-destructive/10 px-6 py-3 text-sm">
      <span><strong>{session.error.operation === 'save' ? 'Save failed' : session.error.message === 'Unsupported design ID' ? 'Unsupported design ID' : 'Unable to open design'}</strong> · {session.error.message}</span>
      {session.error.operation === 'save' ? <Button variant="outline" onClick={() => void save()}>Retry save</Button> : session.error.message !== 'Unsupported design ID' && <Button variant="outline" onClick={() => void session.retryLoad()}>Retry opening</Button>}
    </div>}
    {!isPreviewMode && exportStatus === 'error' && <div role="alert" className="flex shrink-0 items-center justify-between border-b border-destructive/30 bg-destructive/10 px-6 py-3 text-sm"><span>Export failed. Your design is unchanged.</span><Button variant="outline" onClick={() => void exportDesign()}>Retry export</Button></div>}
    {!isPreviewMode && exportStatus === 'exported' && <p role="status" className="border-b border-border px-6 py-2 text-sm">PNG exported</p>}
    <div className="flex min-h-0 flex-1">
      {!isPreviewMode && <nav aria-label="Canvas tools" className="flex w-20 shrink-0 flex-col items-center gap-3 border-r border-border bg-card py-5">
        <Button variant="ghost" className="h-16 w-16 flex-col gap-2 text-xs" disabled={!ready} onClick={clearSelection}><MousePointer2 className="h-5 w-5" />Select</Button>
        <Button variant="ghost" className="h-16 w-16 flex-col gap-2 text-xs" disabled={!ready} onClick={() => {
          const element = createTextElement(); addElement(element); selectElement(element.id);
        }}><Type className="h-5 w-5" />Text</Button>
        <span className="mt-auto px-2 text-center text-xs text-foreground">Desktop preview</span>
      </nav>}
      {ready ? <><V3Canvas isPreviewMode={isPreviewMode} onPreview={() => setIsPreviewMode(true)} /><div className={isPreviewMode ? 'hidden' : 'contents'}><V3TextInspector /></div></> : <main aria-label="Opening workspace" className="grid flex-1 place-items-center bg-muted/40"><p className="text-sm text-foreground">{session.error ? 'Retry opening to load your design.' : 'Loading your workspace…'}</p></main>}
    </div>
  </div>;
}
