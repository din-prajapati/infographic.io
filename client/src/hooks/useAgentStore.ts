import { create } from 'zustand';

export interface AgentInfo {
  name: string;
  phone: string;
  email: string;
  brokerage: string;
  website: string;
  license: string;
  brandColors: string[];
  logoPreview: string | null;
}

interface AgentStore {
  agent: AgentInfo;
  setAgent: (patch: Partial<AgentInfo>) => void;
  resetAgent: () => void;
}

const DEFAULT_AGENT: AgentInfo = {
  name: '',
  phone: '',
  email: '',
  brokerage: '',
  website: '',
  license: '',
  brandColors: [],
  logoPreview: null,
};

export const useAgentStore = create<AgentStore>((set) => ({
  agent: DEFAULT_AGENT,
  setAgent: (patch) =>
    set((state) => ({ agent: { ...state.agent, ...patch } })),
  resetAgent: () => set({ agent: DEFAULT_AGENT }),
}));
