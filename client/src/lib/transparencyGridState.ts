// Transparency grid state management

class TransparencyGridManager {
  private isEnabled: boolean = false;
  private listeners: Set<(enabled: boolean) => void> = new Set();

  getEnabled(): boolean {
    return this.isEnabled;
  }

  setEnabled(enabled: boolean): void {
    if (this.isEnabled === enabled) return;
    
    this.isEnabled = enabled;
    this.notifyListeners();
  }

  toggle(): void {
    this.setEnabled(!this.isEnabled);
  }

  subscribe(listener: (enabled: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.isEnabled));
  }
}

export const transparencyGridManager = new TransparencyGridManager();

// React hook for using transparency grid state
import { useState, useEffect } from 'react';

export function useTransparencyGrid() {
  const [isEnabled, setIsEnabled] = useState(
    transparencyGridManager.getEnabled()
  );

  useEffect(() => {
    const unsubscribe = transparencyGridManager.subscribe(setIsEnabled);
    return unsubscribe;
  }, []);

  return {
    isEnabled,
    setEnabled: (enabled: boolean) => transparencyGridManager.setEnabled(enabled),
    toggle: () => transparencyGridManager.toggle(),
  };
}

