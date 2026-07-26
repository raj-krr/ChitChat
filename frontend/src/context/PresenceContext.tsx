import { createContext, useContext, useEffect, useState } from "react";
import { socket } from "../apis/socket";

type PresenceCtx = {
  onlineUsers: Set<string>;
  lastSeen: Record<string, string>;
};

const PresenceContext = createContext<PresenceCtx>({
  onlineUsers: new Set(),
  lastSeen: {},
});

export function PresenceProvider({ children }: any) {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [lastSeen, setLastSeen] = useState<Record<string, string>>({});

  useEffect(() => {
    const onUserOnline = (userId: any) => {
      const idStr = String(userId);
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.add(idStr);
        return next;
      });
    };

    const onOnlineUsers = (users: any[]) => {
      const stringifiedUsers = (users || []).map((u) => String(u));
      setOnlineUsers(new Set(stringifiedUsers));
    };

    const onUserOffline = ({ userId: offlineUserId, lastSeen: ls }: any) => {
      const idStr = String(offlineUserId);
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(idStr);
        return next;
      });

      setLastSeen((prev) => ({
        ...prev,
        [idStr]: ls,
      }));
    };

    const fetchOnline = () => {
      socket.emit("get-online-users");
    };

    socket.on("online-users", onOnlineUsers);
    socket.on("user-online", onUserOnline);
    socket.on("user-offline", onUserOffline);
    socket.on("connect", fetchOnline);

    if (socket.connected) {
      fetchOnline();
    }

    return () => {
      socket.off("user-online", onUserOnline);
      socket.off("user-offline", onUserOffline);
      socket.off("online-users", onOnlineUsers);
      socket.off("connect", fetchOnline);
    };
  }, []);

  return (
    <PresenceContext.Provider value={{ onlineUsers, lastSeen }}>
      {children}
    </PresenceContext.Provider>
  );
}

export const usePresence = () => useContext(PresenceContext);
