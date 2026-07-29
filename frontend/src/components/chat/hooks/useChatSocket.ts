import { useEffect, useState } from "react";
import { socket } from "../../../apis/socket";
import { axiosInstance } from "../../../apis/axios";

export function useChatSocket({
  chatId,   // other user's ID
  userId,   // my ID
  isGroup = false,
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
          String(m._id) === String(messageId)
            ? { ...m, isDeleted: true }
            : m
        )
      );
    };

    socket.on("message-deleted", onDeleted);
    return () => { socket.off("message-deleted", onDeleted) };
  }, [setMessages]);

const extractId = (val: any): string => {
  if (!val) return "";
  if (typeof val === "object") {
    if (val._id) return String(val._id);
    return String(val);
  }
  return String(val);
};

  /* -------- NEW MESSAGE (FIXED) -------- */
  useEffect(() => {
    if (isGroup && chatId) {
      socket.emit("join-group-room", { groupId: chatId });
    }

    const onNewMessage = ({ message }: any) => {
      if (!message) return;

      const senderIdStr = extractId(message.senderId);
      const receiverIdStr = extractId(message.receiverId);
      const userIdStr = extractId(userId);
      const chatIdStr = extractId(chatId);

      const isMine = Boolean(userIdStr && senderIdStr === userIdStr);
      const isCurrentChat = Boolean(chatIdStr && (senderIdStr === chatIdStr || receiverIdStr === chatIdStr));

      if (!isCurrentChat) return;

      const normalizedMessage = {
        ...message,
        status: isMine ? "sent" : undefined,
        replyTo: message.replyTo
          ? {
              _id: String(message.replyTo._id),
              text: message.replyTo.text,
              senderId: extractId(message.replyTo.senderId),
            }
          : null,
      };

      setMessages((prev: any[]) => {
        if (isMine && message.clientId) {
          const idx = prev.findIndex((m) => m.clientId === message.clientId);

          if (idx !== -1) {
            const copy = [...prev];
            copy[idx] = {
              ...prev[idx],
              ...normalizedMessage,
              status: "sent",
              isTemp: false,
            };
            return copy;
          }

          return prev;
        }

        if (!isMine) {
          const exists = prev.some(
            (m) => m._id && String(m._id) === String(message._id)
          );

          if (exists) return prev;

          return [...prev, normalizedMessage];
        }

        return prev;
      });

      if (shouldAutoScrollRef.current && !message.replyTo) {
        requestAnimationFrame(() =>
          endRef.current?.scrollIntoView({ behavior: "smooth" })
        );
      } else if (!shouldAutoScrollRef.current) {
        setShowNewMsgBtn(true);
      }
    };

    const onNewGroupMessage = ({ groupId, message }: any) => {
      if (!message || String(groupId) !== String(chatId)) return;

      const senderIdStr = extractId(message.senderId);
      const userIdStr = extractId(userId);
      const isMine = Boolean(userIdStr && senderIdStr === userIdStr);

      setMessages((prev: any[]) => {
        if (isMine && message.clientId) {
          const idx = prev.findIndex((m) => m.clientId === message.clientId);
          if (idx !== -1) {
            const copy = [...prev];
            copy[idx] = { ...prev[idx], ...message, status: "sent", isTemp: false };
            return copy;
          }
        }
        const exists = prev.some((m) => m._id && String(m._id) === String(message._id));
        if (exists) return prev;
        return [...prev, message];
      });

      if (shouldAutoScrollRef.current) {
        requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
      }
    };

    socket.on("new-message", onNewMessage);
    socket.on("new-group-message", onNewGroupMessage);

    return () => {
      if (isGroup && chatId) {
        socket.emit("leave-group-room", { groupId: chatId });
      }
      socket.off("new-message", onNewMessage);
      socket.off("new-group-message", onNewGroupMessage);
    };
  }, [chatId, userId, isGroup, setMessages]);

  /* -------- MESSAGE REACTION -------- */
  useEffect(() => {
    const onMessageReaction = ({ messageId, reactions }: any) => {
      setMessages((prev: any[]) =>
        prev.map((m) =>
          String(m._id) === String(messageId) ? { ...m, reactions } : m
        )
      );
    };

    socket.on("message-reaction", onMessageReaction);

    return () => {
      socket.off("message-reaction", onMessageReaction);
    };
  }, [setMessages]);

  /* -------- TYPING -------- */
  useEffect(() => {
    const onTyping = ({ from }: any) => {
      if (extractId(from) === extractId(chatId)) {
        setIsTyping(true);
      }
    };

    const onStopTyping = ({ from }: any) => {
      if (extractId(from) === extractId(chatId)) {
        setIsTyping(false);
      }
    };

    socket.on("typing", onTyping);
    socket.on("stop-typing", onStopTyping);
    return () => {
      socket.off("typing", onTyping);
      socket.off("stop-typing", onStopTyping);
    };
  }, [chatId]);

  /* -------- READ RECEIPT -------- */
  useEffect(() => {
    const onMessagesRead = ({ by }: any) => {
      if (extractId(by) === extractId(chatId)) {
        setMessages((prev: any[]) =>
          prev.map((m) =>
            extractId(m.senderId) === extractId(userId)
              ? { ...m, isRead: true }
              : m
          )
        );
      }
    };

    socket.on("messages-read", onMessagesRead);
    return () => {
      socket.off("messages-read", onMessagesRead);
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
