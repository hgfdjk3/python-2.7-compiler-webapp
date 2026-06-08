import { useRef, useCallback, useEffect } from 'react';

interface UseChatScrollProps {
  messagesCount: number;
  queuedMessagesCount: number;
  streamedContent?: string;
  isPending: boolean;
  showClarification: boolean;
}

export function useChatScroll({
  messagesCount,
  queuedMessagesCount,
  streamedContent,
  isPending,
  showClarification,
}: UseChatScrollProps) {
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUp = useRef(false);
  const lastMessageCount = useRef(messagesCount);
  const lastQueuedCount = useRef(queuedMessagesCount);

  const handleScroll = useCallback(() => {
    if (!scrollViewportRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollViewportRef.current;
    // We consider "near bottom" to be within 150px
    isUserScrolledUp.current = scrollHeight - scrollTop - clientHeight > 150;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (!scrollViewportRef.current) return;
    const { scrollHeight } = scrollViewportRef.current;
    scrollViewportRef.current.scrollTo({
      top: scrollHeight,
      behavior,
    });
  }, []);

  useEffect(() => {
    const isNewMessage = messagesCount > lastMessageCount.current || queuedMessagesCount > lastQueuedCount.current;
    
    if (isNewMessage || showClarification) {
      setTimeout(() => scrollToBottom('smooth'), 50);
    } else if (!isUserScrolledUp.current && isPending) {
      scrollToBottom('smooth');
    }

    lastMessageCount.current = messagesCount;
    lastQueuedCount.current = queuedMessagesCount;
  }, [messagesCount, queuedMessagesCount, streamedContent, isPending, showClarification, scrollToBottom]);

  return {
    scrollViewportRef,
    handleScroll,
  };
}
