// Panel state management for left-side panels
// Ensures only one panel is visible at a time
// Using React Context for reliable state sharing

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type LeftPanelType = 'layers' | 'adjustments' | 'crop' | 'templates' | null;

/** Panels the rail can open. Excludes `null`, which only `closePanel` produces. */
export type OpenablePanel = Exclude<LeftPanelType, null>;

interface PanelStateContextType {
  activePanel: LeftPanelType;
  openPanel: (panel: OpenablePanel) => void;
  closePanel: () => void;
  togglePanel: (panel: OpenablePanel) => void;
}

const PanelStateContext = createContext<PanelStateContextType | null>(null);

interface PanelStateProviderProps {
  children: ReactNode;
}

export function PanelStateProvider({ children }: PanelStateProviderProps) {
  const [activePanel, setActivePanel] = useState<LeftPanelType>(null);

  const openPanel = useCallback((panel: OpenablePanel) => {
    setActivePanel(panel);
  }, []);

  const closePanel = useCallback(() => {
    setActivePanel(null);
  }, []);

  const togglePanel = useCallback((panel: OpenablePanel) => {
    setActivePanel((current) => (current === panel ? null : panel));
  }, []);

  return (
    <PanelStateContext.Provider value={{ activePanel, openPanel, closePanel, togglePanel }}>
      {children}
    </PanelStateContext.Provider>
  );
}

export function usePanelState(): PanelStateContextType {
  const context = useContext(PanelStateContext);
  if (!context) {
    throw new Error('usePanelState must be used within a PanelStateProvider');
  }
  return context;
}

