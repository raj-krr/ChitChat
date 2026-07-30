import { useState } from "react";
import { TextInput } from "@mantine/core";
import { Users, Plus, Link as LinkIcon } from "lucide-react";

import ChatListItem from "./ChatListItem";
import SearchResults from "./SearchResults";
import FriendRequests from "./FriendRequests";
import FriendsBubble from "./FriendsBubble";
import FriendsPicker from "./FriendsPicker";
import CreateGroupModal from "../chat/CreateGroupModal";
import JoinGroupModal from "../chat/JoinGroupModal";

import { useSidebar } from "./useSidebar";

type SidebarProps = {
  onSelectChat: (user: any) => void;
  onSelectGroup?: (group: any) => void;
  showFriendsPicker: boolean;
  setShowFriendsPicker: React.Dispatch<React.SetStateAction<boolean>>;
};
export default function Sidebar({
  onSelectChat,
  onSelectGroup,
  showFriendsPicker,
  setShowFriendsPicker,
}: SidebarProps) {
  const {
    chats,
    setChats,
    groups,
    loadGroups,
    friends,
    filteredUsers,
    query,
    setQuery,
    mode,
    setMode,
    loadChats,
  } = useSidebar();

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);

  return (
    <div
      className="
    relative h-full flex flex-col text-white

    md:bg-white/5
    md:border-r md:border-white/10
    md:shadow-[inset_-1px_0_0_rgba(255,255,255,0.05)]
  "
    >
      {/*  SEARCH */}
      <div
        className="
    sticky top-0 z-20 p-3 space-y-2

    bg-white/20 backdrop-blur-xl
    border-b border-white/20

    md:bg-transparent md:backdrop-blur-0 md:border-0
  "
      >
        {/* BRANDING (MOBILE ONLY) */}
        <h1 className="md:hidden text-2xl font-bold text-white tracking-wide">
          ChitChat
        </h1>
        <TextInput
          placeholder="Search users"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          radius="xl"
          classNames={{
            input:
              "bg-white/90 text-black rounded-full px-4 py-3 focus:ring-2 focus:ring-indigo-400",
          }}
        />

        <div className="flex items-center justify-between gap-1.5 mt-4">
          <div className="flex gap-1.5 w-full">
            <button
              onClick={() => {
                setMode("chats");
                setQuery("");
              }}
              className={`text-xs px-3 py-1.5 rounded-xl transition-colors flex-1 text-center font-medium ${
                mode === "chats"
                  ? "bg-indigo-500 font-semibold shadow-sm"
                  : "bg-white/10 hover:bg-white/20"
              }`}
            >
              Chats
            </button>

            <button
              onClick={() => {
                setMode("groups");
                setQuery("");
              }}
              className={`text-xs px-3 py-1.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 flex-1 font-medium ${
                mode === "groups"
                  ? "bg-indigo-500 font-semibold shadow-sm"
                  : "bg-white/10 hover:bg-white/20"
              }`}
            >
              <Users size={13} />
              Groups ({groups.length})
            </button>

            <button
              onClick={() => {
                setMode("requests");
                setQuery("");
              }}
              className={`text-xs px-3 py-1.5 rounded-xl transition-colors flex-1 text-center font-medium ${
                mode === "requests"
                  ? "bg-indigo-500 font-semibold shadow-sm"
                  : "bg-white/10 hover:bg-white/20"
              }`}
            >
              Requests
            </button>
          </div>
        </div>
      </div>

      {/*  LIST */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-2 pb-28">
        {mode === "requests" && <FriendRequests onAccepted={loadChats} />}

        {mode === "chats" && query && <SearchResults users={filteredUsers} />}

        {mode === "chats" &&
          !query &&
          chats
            .filter((chat) => chat?.user)
            .map((chat) => {
              const key = chat._id || chat.user._id;

              return (
                <ChatListItem
                  key={key}
                  user={chat.user}
                  unreadCount={chat.unreadCount || 0}
                  lastMessage={chat.lastMessage?.text}
                  lastMessageAt={chat.lastMessageAt}
                  onClick={() => {
                    setChats((prev) =>
                      prev.map((c) =>
                        (c._id || c.user?._id) === key
                          ? { ...c, unreadCount: 0 }
                          : c
                      )
                    );
                    onSelectChat(chat.user);
                  }}
                />
              );
            })}

        {mode === "groups" && (
          <div className="space-y-3">
            {/* Quick Actions inside Groups Tab */}
            <div className="grid grid-cols-2 gap-2 pb-1">
              <button
                onClick={() => setShowCreateGroup(true)}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 border border-indigo-500/30"
              >
                <Plus size={14} />
                <span>Create Group</span>
              </button>

              <button
                onClick={() => setShowJoinGroup(true)}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 border border-white/10"
              >
                <LinkIcon size={14} />
                <span>Join Group</span>
              </button>
            </div>

            {groups.length === 0 ? (
              <div className="text-center py-8 px-4 text-slate-300 bg-white/5 rounded-2xl border border-white/5">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50 text-indigo-400" />
                <p className="text-xs font-medium text-white mb-1">No groups yet</p>
                <p className="text-[11px] text-slate-400 mb-4">
                  Create a new group (up to 10 members) or join an existing one using an invite link.
                </p>
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => setShowCreateGroup(true)}
                    className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all shadow-sm"
                  >
                    Create Group
                  </button>
                  <button
                    onClick={() => setShowJoinGroup(true)}
                    className="text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-all border border-white/10"
                  >
                    Join via Invite
                  </button>
                </div>
              </div>
            ) : (
              groups.map((group) => (
                <div
                  key={group._id}
                  onClick={() => onSelectGroup?.(group)}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-all cursor-pointer border border-white/5 active:scale-98"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
                    {group.name?.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm truncate text-white">
                        {group.name}
                      </h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium">
                        {group.members?.length || 1}/10
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 truncate">
                      {group.lastMessage
                        ? `${group.lastMessage.senderName}: ${group.lastMessage.text || "[Media]"}`
                        : group.description || "No messages yet"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/*  NEW CHAT */}
      <div className="hidden md:block absolute bottom-4 right-4">
        <FriendsBubble onOpen={() => setShowFriendsPicker(true)} />
      </div>

      {showFriendsPicker && (
        <FriendsPicker
          friends={friends}
          onSelect={(f: any) => {
            onSelectChat(f);
            setShowFriendsPicker(false);
          }}
          onClose={() => setShowFriendsPicker(false)}
        />
      )}

      {showCreateGroup && (
        <CreateGroupModal
          isOpen={showCreateGroup}
          onClose={() => setShowCreateGroup(false)}
          friends={friends}
          onGroupCreated={(newGroup) => {
            loadGroups();
            onSelectGroup?.(newGroup);
          }}
        />
      )}

      {showJoinGroup && (
        <JoinGroupModal
          isOpen={showJoinGroup}
          onClose={() => setShowJoinGroup(false)}
          onJoinedGroup={(joinedGroup) => {
            loadGroups();
            onSelectGroup?.(joinedGroup);
          }}
        />
      )}
    </div>
  );
}
