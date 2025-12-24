import AppNavbar from "../../components/layout/AppNavbar";
import MobileBottomNav from "../../components/layout/MobileBottomNav";
import TopLoader from "../../components/TopLoader";
import { ArrowLeft, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useScrollDirection } from "../../utils/useScrollDirection";
import { useProfile } from "./useProfile";
import { ProfileView } from "./ProfileView";

export default function ProfilePage() {
  const navigate = useNavigate();
  const navVisible = useScrollDirection();
  const profileState = useProfile();

    const { initializing, profile, handleLogout } = profileState;

  return (
    <div
      className="
        min-h-screen relative overflow-hidden
        bg-gradient-to-b from-indigo-400 via-purple-400 to-pink-400
        md:bg-gradient-to-br md:from-indigo-500 md:via-purple-500 md:to-pink-500
        chitchat-bg
      "
    >
      {/* BACKGROUND GRID */}
      <div
        className="
          absolute inset-0 bg-grid pointer-events-none
          opacity-[0.03] md:opacity-25
        "
      />

      {/* TOP LOADER (NON-BLOCKING) */}
      {initializing && <TopLoader />}

      {/* DESKTOP NAVBAR */}
      <div className="hidden md:block fixed top-0 left-0 w-full z-[100]">
        <AppNavbar active="profile" />
      </div>

      {/* MOBILE HEADER */}
    <div className="md:hidden flex items-center justify-between px-4 py-4 text-white">
  <div className="flex items-center gap-3">
    <button onClick={() => navigate(-1)}>
      <ArrowLeft />
    </button>
    <h1 className="text-lg font-semibold">Profile</h1>
  </div>

  {/* MOBILE LOGOUT ICON */}
  <button
    onClick={handleLogout}
    className="p-2 rounded-full bg-white/20 active:scale-95"
    title="Logout"
  >
    <LogOut size={20} />
  </button>
</div>


      {/* MAIN CONTENT */}
      <div className="relative z-10 px-4 md:mt-24">
        {profile ? (
          <ProfileView {...profileState} />
        ) : (
          <div className="text-white text-center mt-20 opacity-70">
            Loading profile…
          </div>
        )}
      </div>

      {/* MOBILE BOTTOM NAV */}
      <div className="md:hidden">
        <MobileBottomNav active="profile" visible={navVisible} />
      </div>
    </div>
  );
}
