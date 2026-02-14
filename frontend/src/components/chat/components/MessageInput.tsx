import { useState, useRef, useEffect } from "react";
import { sendMessageApi } from "../../../apis/chat.api";
import { socket } from "../../../apis/socket";
import { useAuth } from "../../../context/AuthContext";
import { Paperclip, Send, X, Smile } from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";

export default function MessageInput({
  chatId,
  receiverId,
  onLocalSend,
  replyTo,
  clearReply,
}: any) {
  const [text, setText] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);

  const typingTimeoutRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const close = () => setShowEmoji(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const send = async (retryPayload?: { text: string; file: File | null }) => {
    if (!user || !user._id) return;

    const finalText = retryPayload?.text ?? text;
    const finalFile = retryPayload?.file ?? pendingFile;

    if (!finalText.trim() && !finalFile) return;

    const clientId = crypto.randomUUID();
    const sentAt = performance.now();

    const tempMsg = {
      _id: undefined,
      clientId,
      text: finalText || "",
      senderId: user._id,
      receiverId: receiverId,
      __sentAt: sentAt,
      createdAt: new Date().toISOString(),
      status: "sending",
      isTemp: true,
      replyTo: replyTo
        ? {
            _id: replyTo._id,
            clientId: replyTo.clientId,
            text: replyTo.text,
            senderId: replyTo.senderId,
            senderName:
              replyTo.senderId === user._id
                ? "You"
                : replyTo.senderName,
          }
        : null,
      attachment: finalFile
        ? { name: finalFile.name, type: finalFile.type }
        : undefined,
      onRetry: () => {
        send({ text: finalText, file: finalFile });
      },
    };

    onLocalSend((prev: any[]) => [...prev, tempMsg]);

    setText("");
    setPendingFile(null);
    setShowEmoji(false);

    const form = new FormData();
    form.append("text", finalText || " ");
    form.append("clientId", clientId);
    if (finalFile) form.append("file", finalFile);
    if (replyTo?._id) form.append("replyTo", replyTo._id);

    try {
      await sendMessageApi(chatId, form);
      socket.emit("stop-typing", { to: chatId });
      clearReply?.();
    } catch {
      onLocalSend((prev: any[]) =>
        prev.map((m) =>
          m.clientId === clientId ? { ...m, status: "failed" } : m
        )
      );
    }
  };

  return (
    <div className="px-0 pt-2">
      <div className="bg-white/20 backdrop-blur-md rounded-2xl px-2 sm:px-3 py-1.5 sm:py-2">

        {/* 🔹 REPLY PREVIEW */}
        {replyTo && (
          <div className="mb-1 flex items-center gap-2 px-2 py-0.5 sm:py-1 text-[11px] sm:text-xs rounded-lg bg-black/30 text-white">
            <div className="flex-1 min-w-0">
              <div className="opacity-70 truncate">
                {replyTo.senderId === user._id
                  ? "You"
                  : replyTo.senderName || "User"}
              </div>
              <div className="truncate">
                {replyTo.text ||
                  replyTo.attachment?.name ||
                  "Attachment"}
              </div>
            </div>
            <button
              onClick={clearReply}
              className="opacity-70 hover:opacity-100"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* 🔹 FILE PREVIEW */}
        {pendingFile && (
          <div className="mb-1 flex items-center gap-2 px-2 py-0.5 sm:py-1 text-[11px] sm:text-xs rounded-lg bg-white/20 text-white">
            <span className="truncate flex-1">
              {pendingFile.name}
            </span>
            <button
              onClick={() => setPendingFile(null)}
              className="text-red-400 hover:text-red-300"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* 🔹 INPUT ROW */}
        <div className="relative flex items-center gap-1.5 sm:gap-2 min-h-[32px] sm:min-h-[35px]">

          {/* File */}
          <label className="cursor-pointer text-white/80 shrink-0">
            <Paperclip size={18} className="sm:hidden" />
            <Paperclip size={20} className="hidden sm:block" />
            <input
              ref={fileInputRef}
              type="file"
              hidden
              onChange={(e) =>
                setPendingFile(e.target.files?.[0] || null)
              }
            />
          </label>

          {/* Emoji Button (Desktop Only) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowEmoji((prev) => !prev);
            }}
            className="hidden md:flex text-white/80 hover:text-white shrink-0"
          >
            <Smile size={20} />
          </button>

          {/* Text Input */}
          <input
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              socket.emit("typing", { to: chatId });
              clearTimeout(typingTimeoutRef.current);
              typingTimeoutRef.current = setTimeout(
                () => socket.emit("stop-typing", { to: chatId }),
                1200
              );
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            className="flex-1 bg-transparent text-white text-sm placeholder-white/50 outline-none"
            placeholder="Type a message..."
          />

          {/* Send */}
          <button
            onClick={() => send()}
            disabled={!text.trim() && !pendingFile}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-indigo-500 text-white shrink-0 disabled:opacity-40"
          >
            <Send size={14} className="sm:hidden" />
            <Send size={16} className="hidden sm:block" />
          </button>

          {/* Emoji Picker (Desktop Only) */}
          {showEmoji && (
            <div
              className="absolute bottom-12 left-10 z-50 hidden md:block"
              onClick={(e) => e.stopPropagation()}
            >
              <EmojiPicker
                theme={Theme.DARK}
                onEmojiClick={(emojiData) =>
                  setText((prev) => prev + emojiData.emoji)
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
