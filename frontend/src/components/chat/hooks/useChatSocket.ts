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
    const onNewMessage = ({ message }: any) => {
      if (!message) return;

      const senderIdStr = extractId(message.senderId);
      const receiverIdStr = extractId(message.receiverId);
      const userIdStr = String(userId || "");
      const chatIdStr = String(chatId || "");

      const isMine = senderIdStr === userIdStr;
      const isCurrentChat =
        (senderIdStr === userIdStr && receiverIdStr === chatIdStr) ||
        (senderIdStr === chatIdStr && receiverIdStr === userIdStr);

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

      // AUTO SCROLL (but don't fight reply jump)
      if (shouldAutoScrollRef.current && !message.replyTo) {
        requestAnimationFrame(() =>
          endRef.current?.scrollIntoView({ behavior: "smooth" })
        );
      } else if (!shouldAutoScrollRef.current) {
        setShowNewMsgBtn(true);
      }
    };

    socket.on("new-message", onNewMessage);
    return () => {
      socket.off("new-message", onNewMessage);
    };
  }, [chatId, userId, setMessages]);

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
      if (String(from) === String(chatId)) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 1200);
      }
    };

    socket.on("typing", onTyping);
    return () => {
      socket.off("typing", onTyping);
    };
  }, [chatId]);

  /* -------- READ RECEIPT -------- */
  useEffect(() => {
    const onMessagesRead = ({ by }: any) => {
      if (String(by) === String(chatId)) {
        setMessages((prev: any[]) =>
          prev.map((m) =>
            String(m.senderId) === String(userId)
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
