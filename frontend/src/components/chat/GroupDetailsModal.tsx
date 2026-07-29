import React, { useState } from "react";
import { X, Link as LinkIcon, Check, ShieldCheck, UserPlus } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { usePresence } from "../../context/PresenceContext";
import { addGroupMember } from "../../apis/chat.api";

interface GroupMember {
  _id: string;
  username: string;
  avatar?: string;
  isBot?: boolean;
}

interface GroupDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: {
    _id: string;
    name: string;
    description?: string;
    admin?: any;
    members?: GroupMember[];
    inviteCode?: string;
  };
  friends?: any[];
  onMemberAdded?: () => void;
}

export const GroupDetailsModal: React.FC<GroupDetailsModalProps> = ({
  isOpen,
  onClose,
  group,
  friends = [],
  onMemberAdded,
}) => {
  const { user } = useAuth();
  const { onlineUsers } = usePresence();
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [addingMemberId, setAddingMemberId] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  if (!isOpen || !group) return null;

  const adminId = typeof group.admin === "object" ? group.admin?._id : group.admin;
  const isMeAdmin = adminId === user?._id;

  const existingMemberIds = new Set((group.members || []).map((m) => m._id));
  const availableFriends = (friends || []).filter(
    (f) => !existingMemberIds.has(f._id)
  );

  const handleAddMember = async (friendId: string) => {
    try {
      setAddingMemberId(friendId);
      setAddError(null);
      await addGroupMember(group._id, friendId);
      onMemberAdded?.();
    } catch (err: any) {
      setAddError(err?.response?.data?.msg || "Failed to add member");
    } finally {
      setAddingMemberId(null);
    }
  };

  const handleCopyInvite = () => {
    if (group.inviteCode) {
      const url = `${window.location.origin}/join/${group.inviteCode}`;
      navigator.clipboard.writeText(url);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-slate-900 dark:text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* GROUP HEADER INFO */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg mb-3">
            {group.name?.substring(0, 2).toUpperCase()}
          </div>
          <h3 className="text-xl font-bold">{group.name}</h3>
          {group.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
              {group.description}
            </p>
          )}
          <span className="mt-2 text-xs px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-500/20">
            {group.members?.length || 1} / 10 Members
          </span>
        </div>

        {/* INVITE LINK ACTIONS */}
        <div className="mb-4">
          <button
            onClick={handleCopyInvite}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-xs font-semibold transition-all border border-slate-200 dark:border-slate-700 active:scale-98"
          >
            {copiedInvite ? (
              <>
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-green-500">Invite Link Copied!</span>
              </>
            ) : (
              <>
                <LinkIcon className="w-4 h-4 text-indigo-500" />
                <span>Copy Group Invite Link</span>
              </>
            )}
          </button>
        </div>

        {/* ADD MEMBERS SECTION (ADMIN ONLY) */}
        {isMeAdmin && (group.members?.length || 0) < 10 && (
          <div className="mb-5">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Add Friends to Group
            </h4>
            {addError && (
              <div className="text-xs text-red-500 mb-2">{addError}</div>
            )}
            {availableFriends.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No available friends to add</p>
            ) : (
              <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                {availableFriends.map((friend) => (
                  <div
                    key={friend._id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={
                          friend.avatar ||
                          `https://api.dicebear.com/7.x/bottts/svg?seed=${friend.username}`
                        }
                        alt={friend.username}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <span className="text-xs font-semibold">{friend.username}</span>
                    </div>
                    <button
                      onClick={() => handleAddMember(friend._id)}
                      disabled={addingMemberId === friend._id}
                      className="px-2.5 py-1 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MEMBERS LIST */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Group Members ({group.members?.length || 0})
            </h4>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {group.members?.map((member) => {
              const isMemberAdmin = member._id === adminId;
              const isOnline = onlineUsers.has(member._id);
              const isMe = member._id === user?._id;

              return (
                <div
                  key={member._id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={
                          member.avatar ||
                          `https://api.dicebear.com/7.x/bottts/svg?seed=${member.username}`
                        }
                        alt={member.username}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                      />
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold">
                          {member.username} {isMe && "(You)"}
                        </span>
                        {isMemberAdmin && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[10px] font-bold rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                            <ShieldCheck className="w-3 h-3" />
                            Admin
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {isOnline ? "Online" : "Offline"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupDetailsModal;
