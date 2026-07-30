import { useEffect, useState } from "react";
import { getAllUsersApi } from "../../apis/friend.api";
import { getChatListApi, getMyGroupsApi } from "../../apis/chat.api";
import { socket } from "../../apis/socket";
import { getMyFriendsApi } from "../../apis/friend.api";

export function useSidebar() {
  const [chats, setChats] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"chats" | "groups" | "requests">("chats");
  const [friends, setFriends] = useState<any[]>([]);

  /* -------- INITIAL LOAD -------- */
  useEffect(() => {
    loadChats();
    loadGroups();
    loadAllUsers();
    loadFriends();
  }, []);

  const loadChats = async () => {
    try {
      const res = await getChatListApi();
      setChats(Array.isArray(res.data?.chats) ? res.data.chats : []);
    } catch {
      setChats([]);
    }
  };

  const loadGroups = async () => {
    try {
      const res = await getMyGroupsApi();
      setGroups(Array.isArray(res.data?.groups) ? res.data.groups : []);
    } catch {
      setGroups([]);
    }
  };

  const loadAllUsers = async () => {
    try {
      const res = await getAllUsersApi();
      setAllUsers(Array.isArray(res.data?.users) ? res.data.users : []);
    } catch {
      setAllUsers([]);
    }
  };

  const loadFriends = async () => {
    try {
      const res = await getMyFriendsApi();
      setFriends(res.data.users || []);
    } catch {
      setFriends([]);
    }
  };

  /* -------- SOCKET: UNREAD -------- */
    useEffect(() => {
        const onUnreadUpdate = ({ from }: any) => {
            setChats(prev => {
                let updated = false;

                const next = prev.map(chat => {
                    if (
                        chat.user?._id?.toString() === from.toString() &&
                        !updated
                    ) {
                        updated = true;
                        return {
                            ...chat,
                            unreadCount: (chat.unreadCount || 0) + 1,
                            lastMessageAt: new Date().toISOString(),
                             
                        };
                    }
                    return chat;
                });

                return updated
  ? [
      next.find(c => c.user?._id?.toString() === from.toString()),
      ...next.filter(c => c.user?._id?.toString() !== from.toString()),
    ].filter(Boolean)
  : prev;

            });
        };

        socket.on("unread-update", onUnreadUpdate);
        return () =>{socket.off("unread-update", onUnreadUpdate)
    };
  }, []);

  /* -------- SOCKET: RESET UNREAD -------- */
    useEffect(() => {
        const onMessagesRead = ({ by }: any) => {
            setChats(prev =>
                prev.map(chat =>
                    chat.user?._id?.toString() === by.toString()
                        ? { ...chat, unreadCount: 0 }
                        : chat
                )
            );
        };

        socket.on("messages-read", onMessagesRead);
        return () => {socket.off("messages-read", onMessagesRead)
    };
  }, []);

  const filteredUsers = query
    ? allUsers.filter(
        u =>
          u.username?.toLowerCase().includes(query.toLowerCase()) ||
          u.email?.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return {
    chats,
    setChats,
    groups,
    setGroups,
    loadGroups,
    allUsers,
    friends,
    filteredUsers,
    query,
    setQuery,
    mode,
    setMode,
    loadChats,
  };
}
