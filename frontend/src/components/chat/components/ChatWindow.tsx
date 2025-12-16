import ChatHeader from "./ChatHeader";
import MessageBubble from "../components/MessageBubble";
import MessageInput from "../components/MessageInput";
import { useAuth } from "../../../context/AuthContext";

import { useChatMessages } from "../hooks/useChatMessages";
import { useChatSocket } from "../hooks/useChatSocket";

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

  const {
    showNewMsgBtn,
    setShowNewMsgBtn,
    isTyping,
    markRead,
  } = useChatSocket({
    chatId: chat._id,
    userId: user?._id,
    setMessages,
    shouldAutoScrollRef,
    endRef,
  });

  const handleScroll = async () => {
    const el = containerRef.current;
    if (!el) return;

    const atBottom =
      el.scrollHeight - el.scrollTop <= el.clientHeight + 20;

    shouldAutoScrollRef.current = atBottom;
    
const lastVisibleMsg = visibleMessages[visibleMessages.length - 1];

const hasUnreadFromChatUser =
  lastVisibleMsg &&
  lastVisibleMsg.senderId !== user?._id;


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
      const visibleMessages = messages.filter(
  m => !m.deletedFor?.includes(user._id)
);

  return (
    <div className="flex flex-col h-full relative">
      <ChatHeader user={chat} onBack={onBack} />

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-3 "
      >
    {visibleMessages.map((m, i) => {
  const prev = visibleMessages[i - 1];
  const showDate =
    !prev ||
    new Date(prev.createdAt).toDateString() !==
      new Date(m.createdAt).toDateString();

  const showAvatar =
    !prev || prev.senderId !== m.senderId;

  return (
    <div key={m._id}>
      {showDate && (
        <div className="text-center my-3 text-xs text-white/60">
          {formatDateLabel(m.createdAt)}
        </div>
      )}
      <MessageBubble
        msg={m}
        chatUser={chat}
        showAvatar={showAvatar}
      />
    </div>
  );
})}

        <div ref={endRef} />
      </div>

      {isTyping && (
  <div className="px-4 pb-1 text-xs text-white/60">
    typing…
  </div>
)}


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

      <MessageInput
        chatId={chat._id}
        onLocalSend={(msg: any) =>
          setMessages(prev => [...prev, msg])
        }
      />
    </div>
  );
}
