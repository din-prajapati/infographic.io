// Canvas provider component wrapper

import { ReactNode } from 'react';

interface CanvasProviderProps {
  children: ReactNode;
}

export function CanvasProvider({ children }: CanvasProviderProps) {
  // The Zustand store is already global, so this component
  // just provides a semantic wrapper for future enhancements
  return <>{children}</>;
}
