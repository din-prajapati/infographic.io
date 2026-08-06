import { create } from 'zustand';

export type PropertyType = 'residential' | 'commercial' | 'luxury' | 'land';

export interface PropertyInfo {
  type: PropertyType;
  /** User-written headline shown on the infographic (max 35 chars).
   *  When blank the AI generates one automatically. */
  headline: string;
  price: string;
  beds: number;
  baths: number;
  sqft: string;
  address: string;
  description: string;
  features: string[];
  /**
   * Explicit output-locale override for this property (US-GEN-003 AC6).
   * Empty = fall through to the resolution chain (typed symbol → org default →
   * timezone → passthrough). The property owns locale because a listing's market is
   * a fact about the listing, not about the agent.
   */
  locale: '' | 'en-US' | 'en-IN';
}

interface PropertyStore {
  property: PropertyInfo;
  setProperty: (patch: Partial<PropertyInfo>) => void;
  resetProperty: () => void;
}

const DEFAULT_PROPERTY: PropertyInfo = {
  type: 'residential',
  headline: '',
  price: '',
  beds: 0,
  baths: 0,
  sqft: '',
  address: '',
  description: '',
  features: [],
  locale: '',
};

export const usePropertyStore = create<PropertyStore>((set) => ({
  property: DEFAULT_PROPERTY,
  setProperty: (patch) =>
    set((state) => ({ property: { ...state.property, ...patch } })),
  resetProperty: () => set({ property: DEFAULT_PROPERTY }),
}));
