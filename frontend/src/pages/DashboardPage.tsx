import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import Sidebar from "../components/dashboard/Sidebar";
import ChatWindow from "../components/chat/components/ChatWindow";
import EmptyState from "../components/dashboard/EmptyState";
import AppNavbar from "../components/layout/AppNavbar";
import MobileBottomNav from "../components/layout/MobileBottomNav";
import { useScrollDirection } from "../utils/useScrollDirection";

export default function DashboardPage() {
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [showFriendsPicker, setShowFriendsPicker] = useState(false);
  const isMobileChatOpen = Boolean(selectedChat);

  const [searchParams, setSearchParams] = useSearchParams();

  const sidebarScrollRef = useRef<HTMLDivElement>(null);

  const navVisible = useScrollDirection(sidebarScrollRef);

  useEffect(() => {
    if (searchParams.get("newChat") === "1") {
      setShowFriendsPicker(true);

      const next = new URLSearchParams(searchParams);
      next.delete("newChat");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return (
    <div
      className="
        min-h-screen relative overflow-hidden
        bg-gradient-to-b from-indigo-400 via-purple-400 to-pink-400
        md:bg-gradient-to-br md:from-indigo-500 md:via-purple-500 md:to-pink-500
        chitchat-bg
      "
    >
      {/* Background grid */}
      <div className="absolute inset-0 bg-grid pointer-events-none opacity-[0.03] md:opacity-25" />

      {/* DESKTOP NAVBAR */}
      <div className="hidden md:block fixed top-0 left-0 w-full z-[100]">
        <AppNavbar />
      </div>

      <div className="md:pt-24 relative z-10">
        <div
          className="
            max-w-7xl mx-auto
            h-[calc(100vh-7rem)]
            overflow-hidden
            md:rounded-3xl
            md:bg-white/10
            md:backdrop-blur-2xl
            md:border md:border-white/20
            md:shadow-2xl
          "
        >
          <div className="h-full grid grid-cols-1 md:grid-cols-[320px_1fr]">
            {/*  SIDEBAR (THIS SCROLLS) */}
            <div
              ref={sidebarScrollRef}
              className="h-full  min-h-0"
            >
              <Sidebar
                onSelectChat={setSelectedChat}
                showFriendsPicker={showFriendsPicker}
                setShowFriendsPicker={setShowFriendsPicker}
              />
            </div>

            {/* DESKTOP CHAT */}
            <div className="hidden md:flex flex-col min-h-0">
              {selectedChat ? (
                <ChatWindow
                  chat={selectedChat}
                  onBack={() => setSelectedChat(null)}
                />
              ) : (
                <EmptyState />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE CHAT FULLSCREEN */}
      {selectedChat && (
        <div className="md:hidden fixed inset-0 z-[60] bg-gradient-to-b from-indigo-400 via-purple-400 to-pink-500">
          <ChatWindow
            chat={selectedChat}
            onBack={() => setSelectedChat(null)}
          />
        </div>
      )}

      {/* MOBILE BOTTOM NAV */}
      {!isMobileChatOpen && !showFriendsPicker && (
        <MobileBottomNav
          active="home"
          visible={navVisible}
          onNewChat={() => setShowFriendsPicker(true)}
        />
      )}
    </div>
  );
}
