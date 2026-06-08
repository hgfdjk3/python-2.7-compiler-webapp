import { create } from 'zustand';

interface ApprovalState {
  decisions: Record<string, 'allow' | 'reject' | 'try_again' | 'always_allow'>;
  activeTools: Record<string, string>; // toolCallId -> toolName
  recordDecision: (toolCallId: string, decision: 'allow' | 'reject' | 'try_again' | 'always_allow', toolName?: string) => void;
  claimToolExecution: (toolName: string) => string | undefined; // returns toolCallId if it was pending
}

export const useApprovalStore = create<ApprovalState>((set, get) => ({
  decisions: {},
  activeTools: {},
  recordDecision: (toolCallId, decision, toolName) =>
    set((state) => ({
      decisions: {
        ...state.decisions,
        [toolCallId]: decision,
      },
      activeTools: toolName && (decision === 'allow' || decision === 'always_allow') ? {
        ...state.activeTools,
        [toolCallId]: toolName,
      } : state.activeTools,
    })),
  claimToolExecution: (toolName) => {
    const state = get();
    // Find the first active tool call id for this name (robust match)
    const normalizedName = toolName.trim().toLowerCase();
    const toolCallId = Object.keys(state.activeTools).find(id => 
      state.activeTools[id].trim().toLowerCase() === normalizedName
    );
    if (toolCallId) {
      // Remove it from active tools so it's not claimed again
      set((state) => {
        const newActiveTools = { ...state.activeTools };
        delete newActiveTools[toolCallId];
        return { activeTools: newActiveTools };
      });
      return toolCallId;
    }
    return undefined;
  }
}));
