import { create } from 'zustand';

interface ChatStore {
  isAutomationMode: boolean;
  setIsAutomationMode: (isAutomationMode: boolean) => void;
  automationBuilderData: { nodes: any[], edges: any[], name?: string } | null;
  setAutomationBuilderData: (data: { nodes: any[], edges: any[], name?: string } | null) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  isAutomationMode: false,
  setIsAutomationMode: (isAutomationMode) => set({ isAutomationMode }),
  automationBuilderData: null,
  setAutomationBuilderData: (automationBuilderData) => set({ automationBuilderData }),
}));
