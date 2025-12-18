import { useEffect, useState, useRef } from "react";
import { TextInput, Textarea, Select, Button } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import TopLoader from "../components/TopLoader";
import {
  getProfileApi,
  updateProfileApi,
  uploadProfilePhotoApi,
} from "../apis/profile.api";
import AppNavbar from "../components/layout/AppNavbar";

type Profile = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  dob: string;
  gender: string;
  bio: string;
  avatar: string;
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [initializing, setInitializing] = useState(true);

  /* ---------------- HELPERS ---------------- */
  const formatDate = (date: string) => {
    if (!date) return "";
    return new Date(date).toISOString().split("T")[0];
  };

  const getFullName = () =>
    `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim();

  const updateFullName = (value: string) => {
    const cleaned = value.replace(/\s+/g, " ").trimStart();
    const parts = cleaned.split(" ");
    setProfile((p) =>
      p
        ? {
            ...p,
            firstName: parts[0]?.slice(0, 20) || "",
            lastName: parts.slice(1).join(" ").slice(0, 20),
          }
        : p
    );
  };

  /* ---------------- LOAD PROFILE ---------------- */
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await getProfileApi();
      const u = res.data.safeUser;

      setProfile({
        firstName: u.firstName || "",
        lastName: u.lastName || "",
        username: u.username || "",
        email: u.email || "",
        dob: formatDate(u.dob),
        gender: u.gender ?? "male",
        bio: u.bio || "",
        avatar: u.avatar || "",
      });
    } catch (err) {
      console.error("Profile load failed", err);
    } finally {
      setInitializing(false);
    }
  };

  /* ---------------- VALIDATION ---------------- */
  const validate = () => {
    if (!profile) return false;
    const err: any = {};

    if (!profile.firstName.trim()) err.firstName = "Required";

    const isDesktop = window.matchMedia("(min-width: 640px)").matches;
    if (isDesktop && !profile.lastName.trim()) err.lastName = "Required";

    if (!profile.username.trim()) err.username = "Required";
    else if (profile.username.length > 20)
      err.username = "Max 20 characters";
    else if (!/^[a-zA-Z0-9._-]+$/.test(profile.username))
      err.username = "Invalid username";

    if (profile.bio.length > 50) err.bio = "Max 50 characters";

    if (!profile.dob) err.dob = "DOB required";

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  /* ---------------- SAVE PROFILE ---------------- */
  const saveChanges = async () => {
    if (!profile || !validate()) return;

    try {
      setLoading(true);
      await updateProfileApi({
        firstName: profile.firstName,
        lastName: profile.lastName,
        dob: profile.dob,
        bio: profile.bio,
        gender: profile.gender,
      });
      await loadProfile();
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UPLOAD PHOTO ---------------- */
  const handleUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      await uploadProfilePhotoApi(file);
      await loadProfile();
    } finally {
      setUploading(false);
    }
  };

  /* ---------------- LOGOUT ---------------- */
  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  /* ---------------- INITIAL LOADING ---------------- */
  if (initializing && !profile) {
    return (
      <>
        <TopLoader />
        <div className="
          min-h-screen flex items-center justify-center
          
        /* 📱 MOBILE – light but anchored gradient */
        bg-gradient-to-b
        from-indigo-400 via-purple-400 to-pink-400

        /* 💻 DESKTOP – richer gradient */
        md:bg-gradient-to-br
        md:from-indigo-500 md:via-purple-500 md:to-pink-500
          text-white
        ">
          Loading profile…
        </div>
      </>
    );
  }

  return (
    <>
      {initializing && <TopLoader />}

      <div
        className="
          min-h-screen relative overflow-hidden
          bg-gradient-to-b from-indigo-400 via-purple-400 to-pink-400
          md:bg-gradient-to-br md:from-indigo-500 md:via-purple-500 md:to-pink-500
        "
      >
        {/* DESKTOP NAVBAR */}
        <div className="hidden md:block">
          <AppNavbar active="profile" />
        </div>

        {/* MOBILE HEADER */}
        <div className="md:hidden flex items-center gap-3 px-4 py-4">
          <button onClick={() => navigate(-1)} className="text-white">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-semibold text-white">Profile</h1>
        </div>

        {/* MAIN CARD */}
        <div className="relative z-10 px-4 md:px-0 md:mt-24">
          <div
            className="
              max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[35%_65%]
              bg-transparent md:bg-white/10
              md:rounded-3xl md:border md:border-white/20
              md:backdrop-blur-2xl md:shadow-2xl
              p-4 md:p-6
            "
          >
            {/* LEFT */}
            <div className="flex flex-col items-center text-white pr-6 border-r border-white/20">
              <div className="relative">
                <img
                  src={profile!.avatar}
                  className="w-28 h-28 rounded-full object-cover border-4 border-white/40"
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute bottom-1 right-1 bg-black/40 p-2 rounded-full"
                >
                  {uploading ? "⏳" : "📷"}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleUpload}
                />
              </div>

              <h2 className="mt-4 text-xl font-semibold">
                {profile!.firstName} {profile!.lastName}
              </h2>
              <p className="text-white/80">@{profile!.username}</p>
              <p className="text-white/80">{profile!.email}</p>

              <button
                onClick={logout}
                className="hidden sm:block mt-6 px-4 py-2 rounded-xl
                  bg-red-500/30 border border-red-400/40"
              >
                Logout
              </button>
            </div>

            {/* RIGHT */}
            <div className="pl-6 flex flex-col gap-6 text-white">
              <TextInput
                label="Username"
                value={profile!.username}
                onChange={(e) =>
                  setProfile({ ...profile!, username: e.target.value })
                }
                error={errors.username}
              />

              <div className="hidden sm:grid grid-cols-2 gap-4">
                <TextInput
                  label="First Name"
                  value={profile!.firstName}
                  error={errors.firstName}
                  onChange={(e) =>
                    setProfile({ ...profile!, firstName: e.target.value })
                  }
                />
                <TextInput
                  label="Last Name"
                  value={profile!.lastName}
                  error={errors.lastName}
                  onChange={(e) =>
                    setProfile({ ...profile!, lastName: e.target.value })
                  }
                />
              </div>

              <div className="sm:hidden">
                <TextInput
                  label="Name"
                  value={getFullName()}
                  onChange={(e) => updateFullName(e.target.value)}
                />
              </div>

              <Select
                label="Gender"
                data={["male", "female", "other"]}
                value={profile!.gender}
                onChange={(v) =>
                  setProfile({ ...profile!, gender: v || "" })
                }
              />

              <Textarea
                label="Bio"
                value={profile!.bio}
                error={errors.bio}
                onChange={(e) =>
                  setProfile({ ...profile!, bio: e.target.value })
                }
              />

              <Button
                loading={loading}
                onClick={saveChanges}
                fullWidth
                radius="lg"
                color="indigo"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
