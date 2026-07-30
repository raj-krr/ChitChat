
import { useState, useRef, useEffect } from "react";
import { sendMessageApi, sendGroupMessageApi } from "../../apis/chat.api";
import { socket } from "../../apis/socket";
import { useAuth } from "../../context/AuthContext";
import { Paperclip, Send, X, Smile, Mic, Square, Trash2 } from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";

export default function MessageInput({
  chatId,
  receiverId,
  groupId,
  isGroup = false,
  onLocalSend,
  replyTo,
  clearReply,
}: any) {

  const [text, setText] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);

  const [recording, setRecording] = useState(false);
  const [lockedRecording, setLockedRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);

  const isCancellingRef = useRef(false);
  const isLockedRef = useRef(false);
  const timerRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const typingTimeoutRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    const close = () => setShowEmoji(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getPoint = (e: any) => {
    if (e.touches && e.touches.length) return e.touches[0];
    if (e.changedTouches && e.changedTouches.length) return e.changedTouches[0];
    return e;
  };

  const startRecording = async (e: any) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (e.pointerId && e.currentTarget?.setPointerCapture) {
        e.currentTarget.setPointerCapture(e.pointerId);
      }
    } catch (_) {}

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      isCancellingRef.current = false;
      isLockedRef.current = false;

      recorder.ondataavailable = (ev: BlobEvent) => {
        if (ev.data && ev.data.size > 0) {
          audioChunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = () => {
        clearInterval(timerRef.current);
        stream.getTracks().forEach((track) => track.stop());

        if (isCancellingRef.current) {
          isCancellingRef.current = false;
          setRecordTime(0);
          return;
        }

        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: mimeType });

        const audioFile = new File(
          [blob],
          `voice-${Date.now()}.webm`,
          { type: mimeType }
        );

        setPendingFile(audioFile);
        setRecordTime(0);
      };

      recorder.start(100);
      setRecording(true);
      setRecordTime(0);

      const point = getPoint(e);
      startPosRef.current = {
        x: point.clientX,
        y: point.clientY,
      };

      timerRef.current = setInterval(() => {
        setRecordTime((prev) => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Mic permission denied or unavailable", err);
    }
  };

  const stopRecording = (e?: any) => {
    if (e?.pointerId && e?.currentTarget?.releasePointerCapture) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }

    if (isLockedRef.current) return;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    setRecording(false);
  };

  const stopLockedRecording = () => {
    isLockedRef.current = false;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    clearInterval(timerRef.current);
    setLockedRecording(false);
    setRecording(false);
  };

  const cancelLockedRecording = () => {
    isCancellingRef.current = true;
    stopLockedRecording();
  };

  const handleMove = (e: any) => {
    if (!recording || !startPosRef.current || isLockedRef.current) return;

    const point = getPoint(e);
    const dx = point.clientX - startPosRef.current.x;
    const dy = point.clientY - startPosRef.current.y;

    if (dx < -80) {
      isCancellingRef.current = true;
      stopRecording(e);
    } else if (dy < -80) {
      isLockedRef.current = true;
      setLockedRecording(true);
    }
  };

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
      file: finalFile ? URL.createObjectURL(finalFile) : undefined,
      mimeType: finalFile?.type || (finalFile?.name?.endsWith(".webm") ? "audio/webm" : undefined),
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
        ? { name: finalFile.name, type: finalFile.type, size: finalFile.size }
        : undefined,
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
      if (isGroup && groupId) {
        await sendGroupMessageApi(groupId, form);
        socket.emit("group-stop-typing", { groupId });
      } else {
        await sendMessageApi(chatId, form);
        socket.emit("stop-typing", { to: chatId });
      }
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

    <div
      className="px-0 pt-2 touch-none select-none"
      onPointerMove={handleMove}
      onPointerUp={stopRecording}
    >

      <div className="bg-white/20 backdrop-blur-md rounded-2xl px-2 sm:px-3 py-1.5 sm:py-2">

        {recording && !lockedRecording && (
          <div className="text-xs text-white mb-1.5 flex items-center justify-between animate-in fade-in duration-150">
            <span className="opacity-80">⬅ slide left to cancel</span>
            <span className="font-mono flex items-center gap-1.5 text-red-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {formatTime(recordTime)}
            </span>
            <span className="opacity-80">⬆ slide up to lock</span>
          </div>
        )}

        {lockedRecording && (
          <div className="flex items-center gap-3 mb-1.5 text-white text-xs animate-in fade-in duration-150">
            <span className="font-mono flex items-center gap-1.5 text-red-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {formatTime(recordTime)}
            </span>
            <span className="opacity-80 font-medium">🔒 Recording locked</span>

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={cancelLockedRecording}
                className="p-1.5 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
                title="Discard voice recording"
              >
                <Trash2 size={15} />
              </button>

              <button
                onClick={stopLockedRecording}
                className="p-1.5 rounded-full bg-indigo-500 text-white hover:bg-indigo-600 transition"
                title="Done recording"
              >
                <Square size={14} fill="white" />
              </button>
            </div>
          </div>
        )}

        {replyTo && (
          <div className="mb-1 flex items-center gap-2 px-2 py-0.5 text-xs rounded-lg bg-black/30 text-white">
            <div className="flex-1 min-w-0">
              <div className="opacity-70 truncate">
                {replyTo.senderId === user._id ? "You" : replyTo.senderName || "User"}
              </div>
              <div className="truncate">
                {replyTo.text || replyTo.attachment?.name || "Attachment"}
              </div>
            </div>
            <button onClick={clearReply} className="opacity-70 hover:opacity-100">
              <X size={14}/>
            </button>
          </div>
        )}

        {pendingFile && (
          <div className="mb-2 flex items-center gap-3 p-2 rounded-xl bg-black/30 backdrop-blur-md border border-white/15 text-white">
            {pendingFile.type.startsWith("image/") ? (
              <img
                src={URL.createObjectURL(pendingFile)}
                alt="preview"
                className="w-12 h-12 object-cover rounded-lg border border-white/20 shadow-sm"
              />
            ) : pendingFile.type.startsWith("video/") ? (
              <video
                src={URL.createObjectURL(pendingFile)}
                className="w-12 h-12 object-cover rounded-lg border border-white/20 shadow-sm bg-black"
              />
            ) : pendingFile.type.startsWith("audio/") ? (
              <audio
                key={pendingFile.name}
                src={URL.createObjectURL(pendingFile)}
                controls
                className="flex-1 max-w-[220px] h-8"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-indigo-600/40 flex items-center justify-center text-base">
                📄
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate text-white">{pendingFile.name}</p>
              <p className="text-[10px] text-white/60">
                {(pendingFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>

            <button
              onClick={() => setPendingFile(null)}
              className="p-1 rounded-full hover:bg-white/20 text-white/70 hover:text-red-400 transition"
              title="Remove attachment"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="relative flex items-center gap-2 min-h-[35px]">

          <label className="cursor-pointer text-white/80 hover:text-white transition">
            <Paperclip size={20}/>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              onChange={(e) => setPendingFile(e.target.files?.[0] || null)}
            />
          </label>

          {!text && !pendingFile && !recording && (
            <button
              onPointerDown={startRecording}
              className="text-white/80 hover:text-white transition p-1 rounded-full active:scale-95"
              title="Press/Hold to record voice message"
            >
              <Mic size={20}/>
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowEmoji((prev) => !prev);
            }}
            className="hidden md:flex text-white/80 hover:text-white transition"
          >
            <Smile size={20}/>
          </button>

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

          <button
            onClick={() => send()}
            disabled={!text.trim() && !pendingFile}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-indigo-500 text-white disabled:opacity-40 hover:bg-indigo-600 transition"
          >
            <Send size={16}/>
          </button>

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
