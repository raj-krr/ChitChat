import { useState } from "react";
import Sidebar from "../components/dashboard/Sidebar";
import ChatWindow from "../components/chat/components/ChatWindow";
import EmptyState from "../components/dashboard/EmptyState";
import AppNavbar from "../components/layout/AppNavbar";
import MobileBottomNav from "../components/layout/MobileBottomNav";

export default function DashboardPage() {
  const [selectedChat, setSelectedChat] = useState<any>(null);
const [showFriendsPicker, setShowFriendsPicker] = useState(false);

  const isMobileChatOpen = Boolean(selectedChat);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      
      {/* DESKTOP NAVBAR ONLY */}
      <div className="hidden md:block">
        <AppNavbar />
      </div>
      <div className=" md:pt-24">
        <div
  className="
    max-w-7xl mx-auto
    h-[calc(100vh-7rem)]
    overflow-hidden
    md:overflow-hidden

    md:rounded-3xl
    md:bg-white/10
    md:backdrop-blur-2xl
    md:border md:border-white/20
    md:shadow-2xl
  "
>

          {/* MAIN GRID */}
          <div className="h-full grid grid-cols-1 md:grid-cols-[320px_1fr]">

            {/* SIDEBAR */}
           <div className="block">
              <Sidebar onSelectChat={setSelectedChat}
               showFriendsPicker={showFriendsPicker}
               setShowFriendsPicker={setShowFriendsPicker}  />
            </div>

            {/* CHAT AREA (DESKTOP) */}
            <div className="hidden md:flex flex-col  min-h-0">
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
        <div
          className="
            md:hidden fixed inset-0 z-[60]
            bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500
          "
        >
          <ChatWindow
            chat={selectedChat}
            onBack={() => setSelectedChat(null)}
          />
        </div>
      )}

{!isMobileChatOpen && !showFriendsPicker && (
  <MobileBottomNav
    active="home"
    unreadCount={0}
    onNewChat={() => setShowFriendsPicker(true)}
  />
)}
    </div>
  );
}
