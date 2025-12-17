import { useAuth } from "../../../context/AuthContext";
import { useState } from "react";
import {
  deleteMessageForEveryoneApi,
  deleteMessageForMeApi,
} from "../../../apis/chat.api";

export default function MessageBubble({ msg, chatUser }: any) {
  const { user } = useAuth();
  const [showActions, setShowActions] = useState(false);

  const myId = user?._id?.toString();
   const senderId =
  typeof msg.senderId === "object"
    ? msg.senderId._id?.toString()
    : msg.senderId?.toString();

const isMe = senderId === myId;

  const senderName = isMe ? "You" : chatUser?.username;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowActions(true);
  };

  return (
    <div
      className={`flex ${isMe ? "justify-end" : "justify-start"} mb-2`}
      onClick={() => setShowActions(false)}
    >
      <div
        onContextMenu={handleContextMenu}
        className={`
          max-w-[75%] px-4 py-2 rounded-2xl text-sm
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
          <div className="flex gap-3 mb-2 text-xs opacity-70">
            <button
              disabled={!msg._id}
              onClick={() => {
                if (!msg._id) return;
                deleteMessageForMeApi(msg._id);
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
        )}

        {/* USERNAME */}
        <div className="text-[11px] font-semibold opacity-80 mb-1">
          {senderName}
        </div>

        {/* MESSAGE CONTENT */}
        {msg.isDeleted ? (
          <span className="italic opacity-60">This message was deleted</span>
        ) : (
          <>
            {msg.text && <div>{msg.text}</div>}
            {/* INLINE IMAGE */}
            {msg.file && msg.file.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
              <img src={msg.file} className="mt-2 rounded-lg max-w-full" />
            )}

            {/* INLINE VIDEO */}
            {msg.file && msg.file.match(/\.(mp4|webm|ogg)$/i) && (
              <video
                src={msg.file}
                controls
                className="mt-2 rounded-lg max-w-full"
              />
            )}
            {/* ATTACHMENT */}
            {msg.file && (
              <a
                href={msg.file}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-1 underline text-sm"
              >
                📎 Open attachment
              </a>
            )}

            {/* TEMP ATTACHMENT PREVIEW */}
            {msg.attachment && !msg.file && (
              <div className="mt-1 text-sm opacity-80">
                📎 {msg.attachment.name}
              </div>
            )}
          </>
        )}

        {msg.status === "sending" && typeof msg.progress === "number" && (
          <div className="mt-2 h-1 w-full bg-white/20 rounded">
            <div
              className="h-1 bg-green-400 rounded"
              style={{ width: `${msg.progress}%` }}
            />
          </div>
        )}

        {/* FAILED */}
        {msg.status === "failed" && (
          <div className="text-xs text-red-300 mt-1">Failed to send</div>
        )}

        {msg.status === "failed" && (
          <button
            onClick={() => msg.onRetry?.()}
            className="text-xs text-yellow-300 mt-1 underline"
          >
            Retry
          </button>
        )}

        {/* META */}
        <div className="flex justify-end gap-1 text-[10px] opacity-60 mt-1">
          {msg.createdAt &&
            !isNaN(new Date(msg.createdAt).getTime()) &&
            new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          {isMe && <span>{msg.isRead ? "✔✔" : "✔"}</span>}
        </div>
      </div>
    </div>
  );
}
