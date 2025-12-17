import { useState, useRef } from "react";
import { sendMessageApi } from "../../../apis/chat.api";
import { socket } from "../../../apis/socket";
import { useAuth } from "../../../context/AuthContext";



export default function MessageInput({ chatId, receiverId, onLocalSend }: any) {
  const [text, setText] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const typingTimeoutRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { user } = useAuth();

  
  
  const send = async (retryPayload?: { text: string; file: File | null }) => {
if (!user || !user._id) {
    console.warn("User not ready yet");
    return;
  }

  const finalText = retryPayload?.text ?? text;
  const finalFile = retryPayload?.file ?? pendingFile;

  if (!finalText.trim() && !finalFile) return;

    const clientId = crypto.randomUUID();

    const tempMsg = {
      _id: undefined,               // backend will give later
      clientId,                     // 🔥 UNIQUE FRONTEND ID
      text: finalText || "",
     senderId: user._id,
receiverId: receiverId,

      createdAt: new Date().toISOString(),
      status: "sending",
      isTemp:true,
      progress: 0,
      attachment: finalFile
        ? { name: finalFile.name, type: finalFile.type }
        : undefined,
      onRetry: () => {
        send({ text: finalText, file: finalFile });
      },
    };

    // ✅ add temp message ONCE
    onLocalSend((prev: any[]) => [...prev, tempMsg]);

    setText("");
    setPendingFile(null);

    const form = new FormData();
    form.append("text", finalText || " ");
    if (finalFile) form.append("file", finalFile);

    try {
      await sendMessageApi(chatId, form, (p: number) => {
        onLocalSend((prev: any[]) =>
          prev.map(m =>
            m.clientId === clientId ? { ...m, progress: p } : m
          )
        );
      });

      socket.emit("stop-typing", { to: chatId });
      // ✅ real message will come via socket (no duplicate)

    } catch {
      onLocalSend((prev: any[]) =>
        prev.map(m =>
          m.clientId === clientId ? { ...m, status: "failed" } : m
        )
      );
    }
  };

  return (
    <div className="sticky bottom-0 bg-white/10 backdrop-blur-xl border-t border-white/20 px-4 py-3">
      {pendingFile && (
        <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/20 text-white text-sm">
          📎 {pendingFile.name}
          <button
            onClick={() => setPendingFile(null)}
            className="ml-auto text-red-300"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex gap-3 items-center">
        <label className="cursor-pointer">
          📎
          <input
            ref={fileInputRef}
            type="file"
            hidden
            onChange={(e) =>
              setPendingFile(e.target.files?.[0] || null)
            }
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
          className="flex-1 rounded-xl px-4 py-2 bg-white/20 text-white outline-none"
          placeholder="Type a message..."
        />

        <button
          onClick={() => send()}
          disabled={!text.trim() && !pendingFile}
          className={`px-5 py-2 rounded-xl ${
            text.trim() || pendingFile
              ? "bg-indigo-500 text-white"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Send
        </button>
      </div>
    </div>
  );
}
