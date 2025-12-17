import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

type Props = {
  active: "home" | "search" | "notifications" | "profile";
  unreadCount?: number;
  onNewChat: () => void;
};

export default function MobileBottomNav({
  active,
  unreadCount = 0,
  onNewChat,
}: Props) {
  const navigate = useNavigate();

  const itemClass = (key: string) =>
  `
    relative flex flex-col items-center justify-center
    text-xl
    hover:text-white hover:scale-105
    transition-all duration-200
    active:scale-95
    ${
      active === key
        ? "scale-110 text-white drop-shadow-[0_0_10px_rgba(139,92,246,0.8)]"
        : "text-white/60"
    }
  `;


  return (
    <div
      className="
        fixed bottom-5 left-1/2 -translate-x-1/2
        w-[92%] max-w-sm
        h-16
        backdrop-blur-xl bg-white/20
        border border-white/30
        rounded-full
        flex justify-between items-center
        px-6
        z-[100]
        sm:hidden
        animate-[navIn_0.5s_ease-out]
      "
    >
      <button
        className={itemClass("home")}
              onClick={() => navigate("/dashboard")}
      >
        💬
      </button>

      <button
        className={itemClass("search")}
              onClick={() => navigate("/dashboard")}
      >
        🔍
      </button>

      {/* CENTER NEW CHAT */}
      <button
              onClick={onNewChat}
        className="
          -mt-8 w-14 h-14 rounded-full
          bg-gradient-to-br from-purple-500 to-cyan-400
          flex items-center justify-center
          shadow-xl shadow-purple-500/40
        "
      >
        <Plus size={26} className="text-white" />
      </button>

      <button
        className={itemClass("notifications")}
              onClick={() => navigate("/notifications")}
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 text-[10px] bg-red-500 px-1 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

          <button
        className={itemClass("profile")}
        onClick={() => navigate("/profile")}
      >
        👤
      </button>
    </div>
  );
}
