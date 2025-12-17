import { useEffect, useState } from "react";
import { socket } from "../../../apis/socket";
import { axiosInstance } from "../../../apis/axios";

export function useChatSocket({
  chatId,   // other user's ID
  userId,   // my ID
  setMessages,
  shouldAutoScrollRef,
  endRef,
}: any) {
  const [showNewMsgBtn, setShowNewMsgBtn] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  /* -------- DELETE FOR EVERYONE -------- */
  useEffect(() => {
    const onDeleted = ({ messageId }: any) => {
      setMessages((prev: any[]) =>
        prev.map(m =>
          m._id === messageId
            ? { ...m, isDeleted: true }
            : m
        )
      );
    };

    socket.on("message-deleted", onDeleted);
    return () => { socket.off("message-deleted", onDeleted) };
  }, [setMessages]);

  /* -------- NEW MESSAGE (🔥 FIXED) -------- */
  useEffect(() => {
    const onNewMessage = ({ message }: any) => {
      const isCurrentChat =
        (message.senderId === userId &&
          message.receiverId === chatId) ||
        (message.senderId === chatId &&
          message.receiverId === userId);

      if (!isCurrentChat) return;
    setMessages((prev: any[]) => {
  const tempIndex = prev.findIndex(
    m => m.clientId && m.senderId === userId
  );

  if (tempIndex !== -1) {
    const updated = [...prev];
    updated[tempIndex] = {
      ...message,
      clientId: prev[tempIndex].clientId, // preserve key
    };
    return updated;
  }

  return [...prev, message];
});



      // ✅ SCROLL LOGIC
      if (shouldAutoScrollRef.current) {
        requestAnimationFrame(() =>
          endRef.current?.scrollIntoView({ behavior: "smooth" })
        );
      } else {
        setShowNewMsgBtn(true);
      }
    };

    socket.on("new-message", onNewMessage);
    return () => { socket.off("new-message", onNewMessage) };
  }, [chatId, userId, setMessages]);

  /* -------- TYPING -------- */
  useEffect(() => {
    const onTyping = ({ from }: any) => {
      if (from === chatId) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 1200);
      }
    };

    socket.on("typing", onTyping);
    return () => { socket.off("typing", onTyping) };
  }, [chatId]);

  /* -------- READ RECEIPT -------- */
  useEffect(() => {
    const onMessagesRead = ({ by }: any) => {
      if (by === chatId) {
        setMessages((prev: any[]) =>
          prev.map(m =>
            m.senderId === userId
              ? { ...m, isRead: true }
              : m
          )
        );
      }
    };

    socket.on("messages-read", onMessagesRead);
    return () => {socket.off("messages-read", onMessagesRead)
  };
  }, [chatId, userId, setMessages]);

  const markRead = async () => {
    await axiosInstance.post(`/message/chat/read/${chatId}`);
  };

  return {
    showNewMsgBtn,
    setShowNewMsgBtn,
    isTyping,
    markRead,
  };
}
