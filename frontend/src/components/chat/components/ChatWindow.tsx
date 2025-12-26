import ChatHeader from "./ChatHeader";
import MessageBubble from "../components/MessageBubble";
import MessageInput from "../components/MessageInput";
import { useAuth } from "../../../context/AuthContext";
import { useEffect ,useState} from "react";

import { useChatMessages } from "../hooks/useChatMessages";
import { useChatSocket } from "../hooks/useChatSocket";

const safeDate = (date?: string) => {
  if (!date) return null;
  const d = new Date(date);
  return isNaN(d.getTime()) ? null : d;
};

const formatDateLabel = (date: string) => {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString();
};

export default function ChatWindow({ chat, onBack }: any) {
  const { user } = useAuth();
const [replyTo, setReplyTo] = useState<any>(null);

  const {
    messages,
    setMessages,
    hasMore,
    loadingMore,
    loadMessages,
    containerRef,
    endRef,
    shouldAutoScrollRef,
  } = useChatMessages(chat._id);

  const { showNewMsgBtn, setShowNewMsgBtn, isTyping, markRead } = useChatSocket(
    {
      chatId: chat._id,
      userId: user?._id,
      setMessages,
      shouldAutoScrollRef,
      endRef,
    }
  );

  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      endRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [messages]);

  useEffect(() => {
  setReplyTo(null);
}, [chat._id]);

const scrollToMessage = async (messageId: string) => {
  // Try to find message in DOM
  let el = document.querySelector(
    `[data-msg-id="${messageId}"]`
  ) as HTMLElement | null;

  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("reply-highlight");
    setTimeout(() => el.classList.remove("reply-highlight"), 1200);
    return;
  }

  if (hasMore && !loadingMore) {
    await loadMessages();
  }

  setTimeout(() => {
  const retryEl = document.querySelector(
    `[data-msg-id="${messageId}"]`
  ) as HTMLElement | null;

  if (retryEl) {
    retryEl.scrollIntoView({ behavior: "smooth", block: "center" });
    retryEl.classList.add("reply-highlight");

    setTimeout(() => {
      retryEl.classList.remove("reply-highlight");
    }, 1200);
  }
}, 50);

};

  const handleScroll = async () => {
    const el = containerRef.current;
    if (!el) return;

    const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 20;

    shouldAutoScrollRef.current = atBottom;

    const lastVisibleMsg = visibleMessages[visibleMessages.length - 1];

    const hasUnreadFromChatUser =
      lastVisibleMsg && lastVisibleMsg.senderId !== user?._id;

    if (atBottom) {
      setShowNewMsgBtn(false);

      if (hasUnreadFromChatUser) {
        await markRead();
      }
    }

    if (el.scrollTop < 50 && hasMore && !loadingMore) {
      await loadMessages();
    }
  };
const normalizedMessages = messages.map((m) => ({
  ...m,
  __key: m._id
    ? `server-${m._id}`
    : `client-${m.clientId}`, //  prefix matters
}));

  const visibleMessages = normalizedMessages.filter((m) => {
    if (!m._id) return true;

    return !m.deletedFor?.includes(user._id);
  });

  return (
    <div className="flex flex-col h-full min-h-0 relative">
      <ChatHeader user={chat} onBack={onBack} />

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 pt-3"
      >
        {visibleMessages.map((m, i) => {
          const prev = visibleMessages[i - 1];
          const currDate = safeDate(m.createdAt);
          const prevDate = safeDate(prev?.createdAt);

          const showDate =
            currDate &&
            (!prevDate || currDate.toDateString() !== prevDate.toDateString());

          const showAvatar = !prev || prev.senderId !== m.senderId;

          return (
            <div key={m.__key}>
              {showDate && currDate && (
                <div className="text-center my-3 text-xs text-white/60">
                  {formatDateLabel(currDate.toISOString())}
                </div>
              )}

             <MessageBubble
  msg={m}
  chatUser={chat}
  showAvatar={showAvatar}
                onReply={(msg: any) => setReplyTo(msg)}
                onJump={scrollToMessage}
/>

            </div>
          );
        })}

        <div ref={endRef} />
      </div>

      <div
        className="
    px-4 pb-1 text-xs text-white/60
    transition-opacity duration-200
  "
        style={{
          minHeight: "px",
          opacity: isTyping ? 1 : 0,
        }}
      >
        Typing
        <span className="typing-dots ml-1">
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </span>
      </div>

      {showNewMsgBtn && (
        <button
          onClick={() => {
            endRef.current?.scrollIntoView({ behavior: "smooth" });
            setShowNewMsgBtn(false);
            shouldAutoScrollRef.current = true;
          }}
          className="
           absolute bottom-[96px] md:bottom-[88px]
            left-1/2 -translate-x-1/2
            px-4 py-2 rounded-full
            bg-indigo-600 text-white shadow-lg
          "
        >
          New messages ↓
        </button>
      )}
      <div className="shrink-0 border-t border-white/10 bg-white/10 backdrop-blur-xl">
        {replyTo && (
  <div
    className="
      mx-4 mb-2
      px-3 py-2
      rounded-xl
      bg-white/15 backdrop-blur-md
      text-white
      flex items-center gap-2
    "
  >
    <div className="flex-1 min-w-0">
      <div className="text-xs opacity-70 truncate">
        {replyTo.senderId === user._id ? "You" : replyTo.senderName || "User"}
      </div>

      <div className="text-sm truncate">
        {replyTo.text || replyTo.attachment?.name || "Attachment"}
      </div>
    </div>

    <button
      onClick={() => setReplyTo(null)}
      className="shrink-0 opacity-70 hover:opacity-100"
    >
      ✕
    </button>
  </div>
)}

        <MessageInput
          chatId={chat._id}
          receiverId={chat._id}
  onLocalSend={setMessages}
  replyTo={replyTo}
  clearReply={() => setReplyTo(null)}
/>

      </div>
    </div>
  );
}
