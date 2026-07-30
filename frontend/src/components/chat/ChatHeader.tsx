import { useState } from "react";
import { ArrowLeft, Phone, Video, Users, Link as LinkIcon, Check } from "lucide-react";
import { usePresence } from "../../context/PresenceContext";
import { useGlobalCall } from "../../context/CallContext";
import GroupDetailsModal from "./GroupDetailsModal";

export default function ChatHeader({ user, group, isGroup, onBack }: any) {
  const { onlineUsers, lastSeen } = usePresence();
  const callSocket = useGlobalCall();
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);

  if (isGroup && group) {
    const handleCopyInvite = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (group.inviteCode) {
        const url = `${window.location.origin}/join/${group.inviteCode}`;
        navigator.clipboard.writeText(url);
        setCopiedInvite(true);
        setTimeout(() => setCopiedInvite(false), 2000);
      }
    };

    return (
      <>
        <div 
          onClick={() => setShowGroupModal(true)}
          className="z-20 flex items-center gap-3 px-4 py-3 bg-white/10 backdrop-blur-xl border-b border-white/20 cursor-pointer hover:bg-white/15 transition-all select-none"
        >
          <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="md:hidden text-white">
            <ArrowLeft size={24} />
          </button>

          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
            {group.name?.substring(0, 2).toUpperCase()}
          </div>

          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-white font-semibold flex items-center gap-1.5 truncate">
              {group.name}
            </span>
            <span className="text-xs text-white/70 flex items-center gap-1">
              <Users size={12} />
              {group.members?.length || 1} / 10 Members • <span className="underline hover:text-white">View Details</span>
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleCopyInvite}
              title="Copy Group Invite Link"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all active:scale-95"
            >
              {copiedInvite ? (
                <>
                  <Check size={14} className="text-green-400" />
                  <span className="text-green-400">Copied!</span>
                </>
              ) : (
                <>
                  <LinkIcon size={14} />
                  <span>Invite Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {showGroupModal && (
          <GroupDetailsModal
            isOpen={showGroupModal}
            onClose={() => setShowGroupModal(false)}
            group={group}
          />
        )}
      </>
    );
  }

  const userIdStr = String(user?._id || user?.id || "");
  const isOnline = Boolean(userIdStr && onlineUsers.has(userIdStr));

  return (
    <div className="z-20 flex items-center gap-3 px-4 py-3 bg-white/10 backdrop-blur-xl border-b border-white/20">
      {/* BACK (mobile only) */}
      <button onClick={onBack} className="md:hidden text-white">
        <ArrowLeft size={24} />
      </button>

      {/* AVATAR */}
      <div className="relative">
        <img
          src={user.avatar || "/avatar-placeholder.png"}
          className="w-10 h-10 rounded-full object-cover"
        />
        {!user.isBot && isOnline && (
          <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-400 animate-pulse rounded-full" />
        )}
      </div>

      {/* NAME + STATUS */}
      <div className="flex flex-col">
        <span className="text-white font-semibold">{user.username}</span>
        <span className="text-xs text-white/70">
          {callSocket.callStatus === "calling"
            ? "📡 Calling..."
            : callSocket.callStatus === "connected"
            ? "🎤 In call"
            : user.isBot
            ? "🤖 AI Assistant"
            : isOnline
            ? "online"
            : lastSeen[userIdStr]
            ? `last seen ${new Date(lastSeen[userIdStr]).toLocaleTimeString()}`
            : "offline"}
        </span>
      </div>

      {/* ACTIONS */}
      <div className="ml-auto flex items-center gap-3">
        {!user.isBot && (
          <>
            <button
              onClick={() => { if (callSocket.callStatus === "idle") user.onCall?.("audio"); }}
              disabled={callSocket.callStatus !== "idle"}
              className={`text-white transition ${
                callSocket.callStatus !== "idle"
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:scale-110"
              }`}
            >
              <Phone size={20} />
            </button>

            <button
              onClick={() => { if (callSocket.callStatus === "idle") user.onCall?.("video"); }}
              disabled={callSocket.callStatus !== "idle"}
              className={`text-white transition ${
                callSocket.callStatus !== "idle"
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:scale-110"
              }`}
            >
              <Video size={20} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}