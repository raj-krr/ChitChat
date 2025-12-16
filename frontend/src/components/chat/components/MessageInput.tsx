import { useState, useRef } from "react";
import { sendMessageApi } from "../../../apis/chat.api";
import { socket } from "../../../apis/socket";
import { useAuth } from "../../../context/AuthContext";

export default function MessageInput({ chatId, onLocalSend }: any) {
  const [text, setText] = useState("");
  const typingTimeoutRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { user } = useAuth();

  const send = async () => {
    if (!text.trim()) return;

    const tempMsg = {
      _id: crypto.randomUUID(),
      text,
      senderId: user._id,
      receiverId: chatId,
      createdAt: new Date().toISOString(),
      isTemp: true,
    };

    onLocalSend(tempMsg);
    setText("");

    socket.emit("stop-typing", { to: chatId });

    const form = new FormData();
    form.append("text", text);

     sendMessageApi(chatId, form);
  };

  const handleFile = async (file?: File) => {
    if (!file) return;

    const tempMsg = {
      _id: crypto.randomUUID(),
      text: "📎 Attachment",
      senderId: user._id,
      receiverId: chatId,
      createdAt: new Date().toISOString(),
      isTemp: true,
    };

    onLocalSend(tempMsg);

    const form = new FormData();
    form.append("file", file);

    await sendMessageApi(chatId, form);

    // reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div
      className="
        sticky bottom-0
        bg-white/10 backdrop-blur-xl
        border-t border-white/20
        px-4 py-3
        flex gap-3 items-center
        pb-safe
      "
    >
      {/* FILE UPLOAD */}
      <label className="cursor-pointer">
        📎
        <input
          ref={fileInputRef}
          type="file"
          hidden
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </label>

      {/* EMOJI (DESKTOP ONLY) */}
      <div className="hidden md:block cursor-pointer">😀</div>

      {/* INPUT */}
      <input
        value={text}
        onChange={(e) => {
          setText(e.target.value);

          socket.emit("typing", { to: chatId });

          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }

          typingTimeoutRef.current = setTimeout(() => {
            socket.emit("stop-typing", { to: chatId });
          }, 1200);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
        placeholder="Type a message..."
        className="
          flex-1 rounded-xl px-4 py-2
          bg-white/20 text-white outline-none
        "
      />

      {/* SEND */}
      <button
        disabled={!text.trim()}
        onClick={send}
        className={`
          px-5 py-2 rounded-xl
          ${text.trim()
            ? "bg-indigo-500 text-white"
            : "bg-gray-400 cursor-not-allowed"}
        `}
      >
        Send
      </button>
    </div>
  );
}
