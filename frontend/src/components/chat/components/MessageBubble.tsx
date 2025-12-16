import { useAuth } from "../../../context/AuthContext";
import { useState } from "react";
import { deleteMessageForEveryoneApi,deleteMessageForMeApi } from "../../../apis/chat.api";

export default function MessageBubble({ msg, chatUser }: any) {
  const { user } = useAuth();
const [showActions, setShowActions] = useState(false);

  const myId = user?._id?.toString();
  const senderId =
    typeof msg.senderId === "string"
      ? msg.senderId
      : msg.senderId?._id?.toString();

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
    leading-relaxed
    whitespace-pre-wrap break-words
    ${isMe
      ? "bg-indigo-600 text-white rounded-br-sm"
      : "bg-white/20 text-white rounded-bl-sm"}
    backdrop-blur-md break-words
  `}
>
{showActions && (
  <div className="flex gap-3 mt-2 text-xs opacity-70">
    <button
      onClick={() => {
        deleteMessageForMeApi(msg._id);
        setShowActions(false);
      }}
    >
      Delete for me
    </button>

    {isMe && (
      <button
        onClick={() => {
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

        {/* MESSAGE */}
        {msg.isDeleted ? (
          <span className="italic opacity-60">This message was deleted</span>
        ) : (
          msg.text
        )}

        {/* META */}
        <div className="flex justify-end gap-1 text-[10px] opacity-60 mt-1">
          {new Date(msg.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
          {isMe && <span>{msg.isRead ? "✔✔" : "✔"}</span>}
        </div>
      </div>
    </div>
  );
}
