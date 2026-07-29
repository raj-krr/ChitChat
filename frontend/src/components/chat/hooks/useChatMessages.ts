import { useEffect, useRef, useState } from "react";
import { getMessagesApi, getGroupMessagesApi } from "../../../apis/chat.api";

const PAGE_SIZE = 20;

const mergeUniqueMessages = (oldMsgs: any[], newMsgs: any[]) => {
  const map = new Map<string, any>();

  [...oldMsgs, ...newMsgs].forEach((msg) => {
    const key = msg._id || msg.clientId;
    if (key) {
      map.set(key.toString(), msg);
    }
  });

  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(a.createdAt).getTime() -
      new Date(b.createdAt).getTime()
  );
};

export function useChatMessages(chatId: string, isGroup = false) {
  const [messages, setMessages] = useState<any[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);

  const loadMessages = async (reset = false) => {
    if (loadingMore || (!hasMore && !reset)) return;
    setLoadingMore(true);

    try {
      const currentCursor = reset ? undefined : cursor;
      const res = isGroup
        ? await getGroupMessagesApi(chatId, { cursor: currentCursor, limit: PAGE_SIZE })
        : await getMessagesApi(chatId, { cursor: currentCursor, limit: PAGE_SIZE });

      const newMessages = res.data?.messages || [];
      const nextCursor = res.data?.nextCursor;
      const hasNext = res.data?.hasNextPage ?? (newMessages.length >= PAGE_SIZE);

      if (reset) {
        setMessages(newMessages);
        setCursor(nextCursor);
        setHasMore(hasNext);

        requestAnimationFrame(() =>
          endRef.current?.scrollIntoView({ behavior: "auto" })
        );

        setLoadingMore(false);
        return;
      }

      if (newMessages.length === 0) {
        setHasMore(false);
        setLoadingMore(false);
        return;
      }

      const el = containerRef.current;
      const prevHeight = el?.scrollHeight || 0;

      setMessages((prev) => mergeUniqueMessages(prev, newMessages));
      setCursor(nextCursor);
      setHasMore(hasNext);

      requestAnimationFrame(() => {
        if (!el) return;
        el.scrollTop = el.scrollHeight - prevHeight;
      });
    } catch (err) {
      console.error("Error loading chat messages:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setMessages([]);
    setCursor(undefined);
    setHasMore(true);
    shouldAutoScrollRef.current = true;
    if (chatId) {
      loadMessages(true);
    }
  }, [chatId, isGroup]);

  return {
    messages,
    setMessages,
    hasMore,
    loadingMore,
    loadMessages,
    containerRef,
    endRef,
    shouldAutoScrollRef,
  };
}
