import { ArrowLeft } from "lucide-react";
import { usePresence } from "../../../context/PresenceContext";

export default function ChatHeader({ user, onBack }: any) {
  const { onlineUsers, lastSeen } = usePresence();

  const isOnline = onlineUsers.has(user._id);

  return (
    <div
      className="
         z-20
        flex items-center gap-3
        px-4 py-3
        bg-white/10 backdrop-blur-xl
        border-b border-white/20
      "
    >
      {/* 🔙 BACK (MOBILE ONLY) */}
      <button
        onClick={onBack}
        className="md:hidden text-white"
      >
        <ArrowLeft size={24} />
      </button>

      {/* AVATAR */}
      <div className="relative">
        <img
          src={user.avatar || "/avatar-placeholder.png"}
          className="w-10 h-10 rounded-full object-cover"
        />
       {isOnline && (
          <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 animate-pulse rounded-full" />
          )}
      </div>

      {/* NAME + STATUS */}
      <div className="flex flex-col">
        <span className="text-white font-semibold">
          {user.username}
        </span>
        <span className="text-xs text-white/70">
          {isOnline
            ? "online"
            : lastSeen[user._id]
            ? `last seen ${new Date(lastSeen[user._id]).toLocaleTimeString()}`
            : "offline"}
        </span>
      </div>
    </div>
  );
}
