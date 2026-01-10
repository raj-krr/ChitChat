import { useState, useRef } from "react";
import { sendMessageApi } from "../../../apis/chat.api";
import { socket } from "../../../apis/socket";
import { useAuth } from "../../../context/AuthContext";
import { Paperclip, Send, X } from "lucide-react";

export default function MessageInput({ chatId, receiverId, onLocalSend,replyTo,
  clearReply, }: any) {
  const [text, setText] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const typingTimeoutRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { user } = useAuth();

  const send = async (retryPayload?: { text: string; file: File | null }) => {
    if (!user || !user._id) {
      return;
    }

    const finalText = retryPayload?.text ?? text;
    const finalFile = retryPayload?.file ?? pendingFile;

    if (!finalText.trim() && !finalFile) return;

    const clientId = crypto.randomUUID();
  const sentAt = performance.now();
    const tempMsg = {
      _id: undefined, // backend will give later
      clientId, //  UNIQUE FRONTEND ID
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
        replyTo.senderId === user._id ? "You" : replyTo.senderName,
      }
    : null,

      attachment: finalFile
        ? { name: finalFile.name, type: finalFile.type }
        : undefined,
      onRetry: () => {
        send({ text: finalText, file: finalFile });
      },
    };

    //  add temp message ONCE
    onLocalSend((prev: any[]) => [...prev, tempMsg]);

    setText("");
    setPendingFile(null);

    const form = new FormData();
form.append("text", finalText || " ");
form.append("clientId", clientId);

if (finalFile) form.append("file", finalFile);
if (replyTo?._id) form.append("replyTo", replyTo._id);


    try {
      await sendMessageApi(chatId, form);
      
      socket.emit("stop-typing", { to: chatId });
      clearReply?.();
      //  real message will come via socket (no duplicate)
    } catch {
      onLocalSend((prev: any[]) =>
        prev.map((m) =>
          m.clientId === clientId ? { ...m, status: "failed" } : m
        )
      );
    }
  };

return (
  <div className="sticky bottom-0 z-10 bg-white/10 backdrop-blur-xl border-t border-white/20 px-4 py-3">

    {/* 🔹 REPLY PREVIEW (UI ONLY) */}
    {replyTo && (
      <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-black/30 text-white text-sm">
        <div className="flex-1 min-w-0">
          <div className="text-xs opacity-70 truncate">
            {replyTo.senderId === user._id ? "You" : replyTo.senderName || "User"}
          </div>
          <div className="truncate">
            {replyTo.text || replyTo.attachment?.name || "Attachment"}
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
      <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/20 text-white text-sm">
        <span className="truncate flex-1">{pendingFile.name}</span>
        <button
          onClick={() => setPendingFile(null)}
          className="text-red-400 hover:text-red-300"
        >
          <X size={16} />
        </button>
      </div>
    )}

    {/* 🔹 INPUT ROW */}
    <div className="flex items-center gap-2">
      <label className="cursor-pointer text-white/80 hover:text-white transition shrink-0">
        <Paperclip size={20} />
        <input
          ref={fileInputRef}
          type="file"
          hidden
          onChange={(e) => setPendingFile(e.target.files?.[0] || null)}
        />
      </label>

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
        className="
          flex-1 min-w-0
          rounded-xl px-4 py-2
          bg-white/20 text-white
          outline-none
        "
        placeholder="Type a message..."
      />

      <button
        onClick={() => send()}
        disabled={!text.trim() && !pendingFile}
        className={`
          shrink-0 p-3 rounded-xl transition
          ${
            text.trim() || pendingFile
              ? "bg-indigo-500 text-white hover:bg-indigo-600"
              : "bg-gray-400 cursor-not-allowed"
          }
        `}
      >
        <Send size={18} />
      </button>
    </div>
  </div>
);
}
