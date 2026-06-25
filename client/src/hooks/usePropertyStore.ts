import { create } from 'zustand';

export type PropertyType = 'residential' | 'commercial' | 'luxury' | 'land';

export interface PropertyInfo {
  type: PropertyType;
  price: string;
  beds: number;
  baths: number;
  sqft: string;
  address: string;
  description: string;
  features: string[];
}

interface PropertyStore {
  property: PropertyInfo;
  setProperty: (patch: Partial<PropertyInfo>) => void;
  resetProperty: () => void;
}

const DEFAULT_PROPERTY: PropertyInfo = {
  type: 'residential',
  price: '',
  beds: 0,
  baths: 0,
  sqft: '',
  address: '',
  description: '',
  features: [],
};

export const usePropertyStore = create<PropertyStore>((set) => ({
  property: DEFAULT_PROPERTY,
  setProperty: (patch) =>
    set((state) => ({ property: { ...state.property, ...patch } })),
  resetProperty: () => set({ property: DEFAULT_PROPERTY }),
}));
