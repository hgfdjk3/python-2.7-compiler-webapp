import { ChatMessage } from '../components/Project/Chat/ChatConversation/ChatConversation';

export const parseChatHistory = (history: any[]): ChatMessage[] => {
  const collapsedMessages: ChatMessage[] = [];
  let currentAssistantMessage: ChatMessage | null = null;
  let pendingToolCalls: Record<string, {name: string, args: any}> = {};

  history.forEach((msg: any) => {
    if (msg.type === 'human') {
      if (currentAssistantMessage) {
        // If there were pending tool calls in the middle of history, they are abandoned/cancelled.
        // Render them as uncompleted tool-calls rather than approve-tool blocks.
        Object.entries(pendingToolCalls).forEach(([id, tc]) => {
          const unifiedPayload = { name: tc.name, input: tc.args, output: "Cancelled" };
          const payloadStr = JSON.stringify(unifiedPayload);
          currentAssistantMessage!.content += `\n<tool-call name="${tc.name}"> ${payloadStr} </tool-call>\n`;
        });
        pendingToolCalls = {};
        
        collapsedMessages.push(currentAssistantMessage);
        currentAssistantMessage = null;
      }
      collapsedMessages.push({
        id: msg.id || Math.random().toString(),
        role: 'user',
        content: msg.content || '',
        timestamp: '',
        sourceIds: msg.additional_kwargs?.source_ids
      });
    } else {
      // Accumulate 'ai', 'tool', etc. into a single assistant bubble
      let appendedContent = '';
      if (typeof msg.content === 'string') {
        appendedContent = msg.content;
      } else if (Array.isArray(msg.content)) {
        appendedContent = msg.content.map((block: any) => {
          if (typeof block === 'string') return block;
          if (block && block.type === 'text' && block.text) return block.text;
          return '';
        }).join('');
      }
      
      if (msg.type === 'ai' && msg.tool_calls && msg.tool_calls.length > 0) {
        msg.tool_calls.forEach((tc: any) => {
          pendingToolCalls[tc.id] = { name: tc.name, args: tc.args };
        });
      }
      
      if (msg.type === 'tool') {
         const inputPayload = pendingToolCalls[msg.tool_call_id] 
           ? { name: pendingToolCalls[msg.tool_call_id].name, input: pendingToolCalls[msg.tool_call_id].args }
           : { name: msg.name || 'unknown', input: {} };
           
         const unifiedPayload = {
           ...inputPayload,
           output: msg.content
         };
         
         const payloadStr = JSON.stringify(unifiedPayload);
         appendedContent = `\n<tool-call name="${msg.name || 'unknown'}"> ${payloadStr} </tool-call>\n`;
         if (msg.tool_call_id && pendingToolCalls[msg.tool_call_id]) {
           delete pendingToolCalls[msg.tool_call_id];
         }
      }

      if (!currentAssistantMessage) {
        currentAssistantMessage = {
          id: msg.id || Math.random().toString(),
          role: 'assistant',
          content: appendedContent,
          timestamp: ''
        };
      } else {
        currentAssistantMessage.content += appendedContent;
      }
    }
  });

  // For the final message in the conversation, if there are pending tool calls, they are awaiting approval
  if (currentAssistantMessage) {
    Object.entries(pendingToolCalls).forEach(([id, tc]) => {
      const payload = JSON.stringify({ name: tc.name, input: tc.args });
      currentAssistantMessage!.content += `\n<approve-tool name="${tc.name}" id="${id}"> ${payload} </approve-tool>\n`;
    });
    collapsedMessages.push(currentAssistantMessage);
  }

  return collapsedMessages;
};
