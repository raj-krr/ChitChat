import React, { useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  deleteMessageForEveryoneApi,
  deleteMessageForMeApi,
  messageReactionApi,
} from "../../apis/chat.api";
import { Check, CheckCheck, Clock, Reply, Copy, Trash2 } from "lucide-react";
import FilePreview from "./FilePreview";

const QUICK_EMOJIS = ["❤️", "👍", "😂", "🔥", "😮", "🙏"];

function MessageBubble({ msg, onReply, onJump, onDeleteForMe }: any) {
  const { user } = useAuth();
  const [showActions, setShowActions] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const startX = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => { startX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current === null) return;
    if (e.changedTouches[0].clientX - startX.current > 60) onReply?.(msg);
    startX.current = null;
  };

  const myId = user?._id?.toString();
  const senderId = typeof msg.senderId === "object"
    ? msg.senderId._id?.toString()
    : msg.senderId?.toString();
  const isMe = senderId === myId;

  const targetId = (msg._id || msg.id)?.toString();

  const react = async (messageId: string, emoji: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!messageId) return;
    try {
      await messageReactionApi(messageId, emoji);
      setShowActions(false);
    } catch (err) {
      console.error("Reaction failed", err);
    }
  };

  const handleCopy = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (msg.text) {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(msg.text);
        } else {
          const textArea = document.createElement("textarea");
          textArea.value = msg.text;
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }
      } catch (err) {
        console.error("Failed to copy text", err);
      }
      window.dispatchEvent(new CustomEvent("show-copy-toast"));
      setShowActions(false);
    }
  };

  return (
    <div
      data-msg-id={msg._id ?? msg.clientId}
      className={`group relative flex w-full min-w-0 ${isMe ? "justify-end" : "justify-start"} mb-1`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="relative max-w-[80%] pt-2 -mt-2">
        {/* FLOATING HOVER ACTION BAR (Desktop Hover / Mobile Context Menu) */}
        <div
          className={`
            absolute -top-9 ${isMe ? "right-0" : "left-0"}
            hidden group-hover:flex items-center gap-1.5 px-2.5 py-1.5
            rounded-full bg-slate-900/90 dark:bg-slate-900/95 backdrop-blur-xl
            border border-white/15 shadow-xl z-20 transition-all duration-200
            after:content-[''] after:absolute after:-bottom-3 after:left-0 after:right-0 after:h-4
          `}
        >
          {QUICK_EMOJIS.slice(0, 4).map((emoji) => (
            <button
              key={emoji}
              onClick={(e) => targetId && react(targetId, emoji, e)}
              className="hover:scale-130 transition text-sm px-1"
            >
              {emoji}
            </button>
          ))}

          <div className="w-[1px] h-4 bg-white/20 mx-0.5" />

          <button
            onClick={(e) => { e.stopPropagation(); onReply?.(msg); }}
            className="p-1 rounded-full hover:bg-white/15 text-white/80 hover:text-white transition"
            title="Reply"
          >
            <Reply size={13} />
          </button>

          {msg.text && (
            <button
              onClick={handleCopy}
              className="p-1 rounded-full hover:bg-white/15 text-white/80 hover:text-white transition"
              title="Copy"
            >
              <Copy size={13} />
            </button>
          )}

          {targetId && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowDeleteMenu(true); }}
              className="p-1 rounded-full hover:bg-red-500/20 text-red-400 transition"
              title="Delete"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>

        {/* WHATSAPP-STYLE DELETE POPUP MENU (TOP-RIGHT OF BUBBLE IN CHAT WINDOW) */}
        {showDeleteMenu && (
          <>
            {/* Transparent backdrop to close on outside click */}
            <div
              className="fixed inset-0 z-30"
              onClick={(e) => { e.stopPropagation(); setShowDeleteMenu(false); }}
            />
            <div
              className={`
                absolute ${isMe ? "-top-12 right-0" : "-top-12 left-0"} z-40
                w-48 p-1.5 rounded-xl
                bg-[#111b21] text-slate-100
                border border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.6)]
                backdrop-blur-xl flex flex-col gap-0.5 text-xs font-normal
                animate-in fade-in zoom-in-95 duration-100
              `}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (targetId) deleteMessageForMeApi(targetId);
                  onDeleteForMe?.(targetId);
                  setShowDeleteMenu(false);
                  setShowActions(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#202c33] transition flex items-center justify-between text-slate-100"
              >
                <span>Delete for me</span>
              </button>

              {isMe && targetId && !msg.isDeleted && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMessageForEveryoneApi(targetId);
                    setShowDeleteMenu(false);
                    setShowActions(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-500/20 text-red-400 font-medium transition flex items-center justify-between"
                >
                  <span>Delete for everyone</span>
                </button>
              )}

              <div className="w-full h-[1px] bg-white/10 my-0.5" />

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-white/5 transition text-white/40 hover:text-white text-[11px]"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {/* BUBBLE CONTAINER */}
        <div
          onContextMenu={(e) => { e.preventDefault(); setShowActions(!showActions); }}
          className={`
            relative w-fit min-w-0 px-3.5 py-2 rounded-2xl text-sm shadow-sm
            ${
              isMe
                ? "bg-[#6366f1] text-white rounded-br-none"
                : "bg-[#454a58] text-white rounded-bl-none"
            }
          `}
        >
          {/* MOBILE / CONTEXT MENU ACTIONS */}
          {showActions && (
            <div className="flex flex-col gap-2 mb-2 pb-2 border-b border-white/15 text-xs">
              <div className="flex items-center gap-2">
                {QUICK_EMOJIS.map((e) => (
                  <button key={e} onClick={(evt) => targetId && react(targetId, e, evt)} className="text-base hover:scale-125 transition">
                    {e}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 opacity-80 pt-1">
                <button onClick={(e) => { e.stopPropagation(); onReply?.(msg); setShowActions(false); }}>Reply</button>
                <button onClick={handleCopy}>Copy</button>
                <button onClick={(e) => { e.stopPropagation(); setShowDeleteMenu(true); }}>
                  Delete
                </button>
              </div>
            </div>
          )}

          {/* MESSAGE CONTENT */}
          {msg.isDeleted ? (
            <span className="italic opacity-60">This message was deleted</span>
          ) : (
            <>
              {/* SENDER NAME (For incoming messages in groups / chats) */}
              {!isMe && (
                <div className="text-[11px] font-bold text-amber-300 dark:text-amber-400 mb-1 leading-tight">
                  {typeof msg.senderId === "object"
                    ? msg.senderId.username
                    : msg.senderName || "Group Member"}
                </div>
              )}

              {/* REPLY PREVIEW */}
              {msg.replyTo && (
                <div
                  className="relative z-10 mb-2 px-3 py-1.5 rounded-lg bg-black/25 border-l-4 border-indigo-400 text-xs cursor-pointer hover:bg-black/35 transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    const id = msg.replyTo._id ?? msg.replyTo.clientId;
                    if (id) onJump?.(id.toString());
                  }}
                >
                  <div className="opacity-70 font-semibold mb-0.5">
                    {msg.replyTo.senderId?.toString() === myId ? "You" : msg.replyTo.senderName || "User"}
                  </div>
                  <div className="truncate opacity-90">{msg.replyTo.text || "Attachment"}</div>
                </div>
              )}

              {/* TEXT */}
              {msg.text?.trim() && (
                <div className="inline-flex items-baseline gap-3.5 flex-wrap whitespace-pre-wrap break-words">
                  <span className="text-[14px] font-semibold text-white tracking-wide">{msg.text}</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-normal text-slate-300/80 select-none">
                    {msg.createdAt && new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {isMe && (
                      <>
                        {msg.status === "sending"   && <Clock size={12} />}
                        {msg.status === "sent"       && !msg.isRead && <Check size={13} />}
                        {msg.status === "delivered"  && !msg.isRead && <CheckCheck size={13} />}
                        {msg.isRead && <CheckCheck size={13} className="text-sky-300" />}
                      </>
                    )}
                  </span>
                </div>
              )}

              {/* FILE PREVIEW */}
              {(msg.file || msg.attachment) && (
                <FilePreview
                  file={typeof msg.file === "string" ? msg.file : undefined}
                  attachment={msg.attachment && typeof msg.attachment === "object" && "size" in msg.attachment ? msg.attachment : undefined}
                  mimeType={msg.mimeType ?? msg.fileType ?? undefined}
                  isMe={isMe}
                />
              )}
            </>
          )}

          {/* REACTIONS BADGE */}
          {msg.reactions?.length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {(Object.entries(
                msg.reactions.reduce((acc: Record<string, number>, r: any) => {
                  acc[r.emoji] = (acc[r.emoji] || 0) + 1; return acc;
                }, {} as Record<string, number>)
              ) as [string, number][]).map(([emoji, count]) => (
                <span key={emoji} className="px-2 py-0.5 text-xs bg-white/20 dark:bg-white/10 rounded-full border border-white/10">
                  {emoji} {count}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default React.memo(MessageBubble);