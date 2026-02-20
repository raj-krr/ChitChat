import React from "react";
import { useAuth } from "../../context/AuthContext";
import { useState, useRef } from "react";
import {
  deleteMessageForEveryoneApi,
  deleteMessageForMeApi,
  messageReactionApi,
} from "../../apis/chat.api";
import { Paperclip, File, Check, CheckCheck, Clock } from "lucide-react";

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

const getFileType = (urlOrName: string) => {
  const ext = urlOrName.split(".").pop()?.toLowerCase();

  if (!ext) return "file";

  if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) return "image";
  if (["mp4", "mov", "webm"].includes(ext)) return "video";
  if (["pdf"].includes(ext)) return "pdf";
  if (["doc", "docx"].includes(ext)) return "doc";
  if (["xls", "xlsx"].includes(ext)) return "excel";

  return "file";
};

//  export default function MessageBubble({ msg, chatUser }: any) {
function MessageBubble({ msg, onReply, onJump, onDeleteForMe }: any) {
  const { user } = useAuth();
  const [showActions, setShowActions] = useState(false);

  const startX = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current === null) return;

    const deltaX = e.changedTouches[0].clientX - startX.current;

    if (deltaX > 60) {
      onReply?.(msg);
    }

    startX.current = null;
  };

  const myId = user?._id?.toString();
  const senderId =
    typeof msg.senderId === "object"
      ? msg.senderId._id?.toString()
      : msg.senderId?.toString();

  const getPreviewUrl = () => {
    if (typeof msg.file === "string") {
      return msg.file;
    }

    // local file before upload (REAL File)
    if (
      msg.attachment &&
      typeof msg.attachment === "object" &&
      "name" in msg.attachment &&
      "size" in msg.attachment &&
      "type" in msg.attachment
    ) {
      return URL.createObjectURL(msg.attachment as File);
    }

    return null;
  };

  const fileType = msg.file
    ? getFileType(msg.file)
    : msg.attachment
    ? getFileType(msg.attachment.name)
    : null;

  const previewUrl = getPreviewUrl();

  const isMe = senderId === myId;

  // const senderName = isMe ? "You" : chatUser?.username;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowActions(true);
  };

  const react = async (messageId: string, emoji: string) => {
    try {
      await messageReactionApi(messageId, emoji);
      setShowActions(false);
    } catch (err) {
      console.error("Reaction failed", err);
    }
  };

  return (
    <div
      data-msg-id={msg._id ?? msg.clientId}
      className={`flex w-full min-w-0 ${isMe ? "justify-end" : "justify-start"} mb-1`}
      onClick={() => setShowActions(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div
        onContextMenu={handleContextMenu}
        className={`
          relative
          w-fit min-w-0 max-w-[80%] px-4 py-2 rounded-2xl text-sm
          leading-relaxed whitespace-pre-wrap break-words 
          backdrop-blur-md
          ${
            isMe
              ? "bg-indigo-600 text-white rounded-br-sm"
              : "bg-white/20 text-white rounded-bl-sm"
          }
         
        `}
      >
        {/* ACTIONS */}
        {showActions && (
          <>
            <div className="flex gap-3 mb-2 text-xs opacity-70">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReply?.(msg);
                  setShowActions(false);
                }}
              >
                Reply
              </button>

              <button
                disabled={!msg._id}
                onClick={() => {
                  if (!msg._id) return;
                  deleteMessageForMeApi(msg._id);
                  onDeleteForMe?.(msg._id);
                  setShowActions(false);
                }}
              >
                Delete for me
              </button>

              {isMe && (
                <button
                  disabled={!msg._id}
                  onClick={() => {
                    if (!msg._id) return;
                    deleteMessageForEveryoneApi(msg._id);
                    setShowActions(false);
                  }}
                  className="text-red-400"
                >
                  Delete for everyone
                </button>
              )}
            </div>

            {/* 🔥 EMOJI REACTIONS */}
            <div className="flex gap-2 mb-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => msg._id && react(msg._id, e)}
                  className="text-lg hover:scale-125 transition"
                >
                  {e}
                </button>
              ))}
            </div>
          </>
        )}

        {/* USERNAME */}
        {/* <div className="text-[11px] font-semibold opacity-80 mb-1">
          {senderName}
        </div> */}

        {/* MESSAGE CONTENT */}
        {msg.isDeleted ? (
          <span className="italic opacity-60">This message was deleted</span>
        ) : (
          <>
            {msg.replyTo && (
              <div
                className="relative z-10 mb-2 px-3 py-2 rounded-lg bg-black/25 border-l-4 border-indigo-400 text-xs cursor-pointer hover:bg-black/30"
                onClick={(e) => {
                  e.stopPropagation();

                  const targetId = msg.replyTo._id ?? msg.replyTo.clientId;

                  if (!targetId) return;

                  onJump?.(targetId.toString());
                }}
              >
                <div className="opacity-70 mb-1">
                  {msg.replyTo.senderId?.toString() === myId
                    ? "You"
                    : msg.replyTo.senderName || "user"}
                </div>

                <div className="truncate">
                  {msg.replyTo.text || "Attachment"}
                </div>
              </div>
            )}

            {/* TEXT (only if meaningful) */}
          {msg.text?.trim() && (
  <div className="whitespace-pre-wrap break-words ">
    {msg.text}

    <span className="ml-2 inline-flex items-center gap-1 text-[10px] opacity-60 align-bottom">
      {msg.createdAt &&
        new Date(msg.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}

      {isMe && (
        <>
          {msg.status === "sending" && <Clock size={12} />}
          {msg.status === "sent" && !msg.isRead && <Check size={14} />}
          {msg.status === "delivered" && !msg.isRead && (
            <CheckCheck size={14} />
          )}
          {msg.isRead && (
            <CheckCheck size={14} className="text-blue-400" />
          )}
        </>
      )}
    </span>
  </div>
)}

            {fileType === "image" && previewUrl && (
              <img
                src={previewUrl}
                alt="attachment"
                className="mt-2 max-w-[160px] max-h-[160px] rounded-lg object-cover cursor-pointer"
                onClick={() => window.open(msg.file || previewUrl, "_blank")}
              />
            )}

            {/* VIDEO FILE (icon-based, not inline video) */}
            {msg.file && fileType === "video" && (
              <div
                onClick={() => window.open(msg.file, "_blank")}
                className="mt-2 flex items-center gap-3 p-3 rounded-lg bg-black/20 cursor-pointer"
              >
                🎥
                <span className="text-sm truncate max-w-[160px]">
                  {msg.file.split("/").pop()}
                </span>
              </div>
            )}

            {/* DOCUMENT / OTHER FILE */}
            {msg.file &&
              ["pdf", "doc", "excel", "file"].includes(fileType!) && (
                <div
                  onClick={() => window.open(msg.file, "_blank")}
                  className="mt-2 flex items-center gap-3 p-3 rounded-lg bg-white/20 hover:bg-white/30 cursor-pointer"
                >
                  <span className="text-2xl">
                    {fileType === "pdf" && "📄"}
                    {fileType === "doc" && "📝"}
                    {fileType === "excel" && "📊"}
                    {fileType === "file" && <File size={20} />}
                  </span>

                  <div className="flex flex-col text-sm">
                    <span className="truncate max-w-[160px]">
                      {msg.file.split("/").pop()}
                    </span>
                    <span className="text-xs opacity-60">Tap to open</span>
                  </div>
                </div>
              )}

            {/* TEMP FILE (before upload finishes) */}
            {msg.attachment && !msg.file && (
              <div className="mt-2 flex items-center gap-2 text-sm opacity-80">
                <Paperclip size={16} /> {msg.attachment.name}
              </div>
            )}
          </>
        )}

        {msg.status === "sending" && (
          <span className="text-xs opacity-60"></span>
        )}

        {msg.status === "failed" && (
          <button onClick={msg.onRetry} className="text-red-400 text-xs">
            Retry
          </button>
        )}
        {msg.reactions?.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {(
              Object.entries(
                msg.reactions.reduce((acc: Record<string, number>, r: any) => {
                  acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ) as [string, number][]
            ).map(([emoji, count]) => (
              <span
                key={emoji}
                className="px-2 py-0.5 text-xs bg-white/20 rounded-full"
              >
                {emoji} {count}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
export default React.memo(MessageBubble);
