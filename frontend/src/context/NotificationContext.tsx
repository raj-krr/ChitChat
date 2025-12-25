import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { getNotificationsApi , markAllNotificationsReadApi} from "../apis/notification.api";

type NotificationContextType = {
  notifications: any[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
    markLocalRead: (id: string) => void;
  markAllRead: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextType | null>(
  null
);

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error(
      "useNotifications must be used inside NotificationProvider"
    );
  }
  return ctx;
};
export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await getNotificationsApi();
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const markLocalRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n._id === id ? { ...n, read: true } : n
      )
    );

    setUnreadCount((c) => Math.max(0, c - 1));
  };

  useEffect(() => {
    fetchNotifications();
  }, []);
    
    const markAllRead = async () => {
  try {
    await markAllNotificationsReadApi();

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    );

    setUnreadCount(0);
  } catch (err) {
    console.error("MARK ALL READ ERROR", err);
  }
};


  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markLocalRead,
        markAllRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
