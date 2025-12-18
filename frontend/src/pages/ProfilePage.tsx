import { useEffect, useState, useRef } from "react";
import { TextInput, Textarea, Select, Button } from "@mantine/core";
import { useNavigate } from "react-router-dom";
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

  const isMobile = window.innerWidth < 640;

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

    const firstName = parts[0] || "";
    const lastName = parts.slice(1).join(" ");

    setProfile((p) =>
      p
        ? {
            ...p,
            firstName: firstName.slice(0, 20),
            lastName: lastName.slice(0, 20),
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
      console.error(err);
    }
  };

  /* ---------------- INPUT LIMITERS ---------------- */
  const updateFirst = (v: string) =>
    setProfile((p) => p && { ...p, firstName: v.slice(0, 20) });

  const updateLast = (v: string) =>
    setProfile((p) => p && { ...p, lastName: v.slice(0, 20) });

  const updateBio = (v: string) =>
    setProfile((p) => p && { ...p, bio: v.slice(0, 50) });

  /* ---------------- VALIDATION ---------------- */
  const validate = () => {
    if (!profile) return false;
    const err: any = {};

    if (!profile.firstName.trim()) err.firstName = "Required";

    if (!isMobile && !profile.lastName.trim())
      err.lastName = "Required";

    if (!profile.username.trim()) err.username = "Required";
    else if (profile.username.length > 20)
      err.username = "Max 20 characters";
    else if (!/^[a-zA-Z0-9._-]+$/.test(profile.username))
      err.username = "Only letters, numbers, . _ - allowed";

    if (profile.bio.length > 50) err.bio = "Max 50 characters";

    if (!profile.dob) err.dob = "DOB required";
    else {
      const today = new Date();
      const d = new Date(profile.dob);
      let age = today.getFullYear() - d.getFullYear();
      const m = today.getMonth() - d.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
      if (age < 12) err.dob = "Minimum age 12";
      if (age > 100) err.dob = "Maximum age 100";
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  /* ---------------- SAVE PROFILE ---------------- */
  const saveChanges = async () => {
    if (!profile || !validate()) return;

    try {
      setLoading(true);

      const payload: any = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        dob: profile.dob,
        bio: profile.bio,
        gender: profile.gender,
      };

      await updateProfileApi(payload);
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

  if (!profile) return null;

  return (
    <div
      className="
        min-h-screen relative overflow-hidden

        /* 📱 MOBILE – light gradient */
        bg-gradient-to-b
        from-indigo-400 via-purple-400 to-pink-400

        /* 💻 DESKTOP – unchanged */
        md:bg-gradient-to-br
        md:from-indigo-500 md:via-purple-500 md:to-pink-500
      "
    >
      {/* DESKTOP NAVBAR */}
      <div className="hidden md:block">
        <AppNavbar active="profile" />
      </div>

      {/* 📱 MOBILE HEADER */}
      <div className="md:hidden flex items-center gap-3 px-4 py-4">
        <button
          onClick={() => navigate(-1)}
          className="text-white text-xl"
        >
          ←
        </button>
        <h1 className="text-lg font-semibold text-white">
          Profile
        </h1>
      </div>

      {/* MAIN CARD */}
      <div className="relative z-10 px-4 md:px-0 md:mt-24">
        <div
          className="
            max-w-5xl mx-auto
            grid grid-cols-1 lg:grid-cols-[35%_65%]

            /* 📱 MOBILE – flat */
            bg-transparent
            shadow-none
            rounded-none
            backdrop-blur-0

            /* 💻 DESKTOP – SAME AS BEFORE */
            md:rounded-3xl
            md:border md:border-white/20
            md:shadow-2xl
            md:bg-white/10
            md:backdrop-blur-2xl

            p-4 md:p-6
          "
        >
          {/* LEFT PANEL */}
          <div className="flex flex-col items-center text-white border-r border-white/20 pr-6">
            <div className="relative">
              <img
                src={profile.avatar}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover
                  border-4 border-white/40 shadow-xl"
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
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
              />
            </div>

            <h2 className="mt-4 text-xl font-semibold">
              {profile.firstName} {profile.lastName}
            </h2>

            <p className="text-white/80">@{profile.username}</p>
            <p className="text-white/80">{profile.email}</p>

            <button
              onClick={logout}
              className="hidden sm:block mt-6 px-4 py-2 rounded-xl
                bg-red-500/30 border border-red-400/40"
            >
              Logout
            </button>
          </div>

          {/* RIGHT PANEL */}
          <div className="pl-6 flex flex-col text-white gap-6 mt-8 lg:mt-0">
            <TextInput
              label="Username"
              value={profile.username}
              onChange={(e) => {
                const val = e.target.value;
                if (/^[a-zA-Z0-9._-]{0,20}$/.test(val))
                  setProfile({ ...profile, username: val });
              }}
              error={errors.username}
            />

            {/* DESKTOP NAME */}
            <div className="hidden sm:grid grid-cols-2 gap-4">
              <TextInput
                label="First Name"
                value={profile.firstName}
                onChange={(e) => updateFirst(e.target.value)}
                error={errors.firstName}
              />
              <TextInput
                label="Last Name"
                value={profile.lastName}
                onChange={(e) => updateLast(e.target.value)}
                error={errors.lastName}
              />
            </div>

            {/* MOBILE NAME */}
            <div className="sm:hidden">
              <TextInput
                label="Name"
                value={getFullName()}
                onChange={(e) => updateFullName(e.target.value)}
                placeholder="e.g. Raj Kumar"
                error={errors.firstName || errors.lastName}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Gender"
                data={["male", "female", "other"]}
                value={profile.gender}
                onChange={(v) =>
                  setProfile({ ...profile, gender: v || "" })
                }
              />

              <div>
                <label className="text-sm">Date of Birth</label>
                <input
                  type="date"
                  value={profile.dob}
                  onChange={(e) =>
                    setProfile({ ...profile, dob: e.target.value })
                  }
                  className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white"
                />
                {errors.dob && (
                  <p className="text-red-400 text-sm">{errors.dob}</p>
                )}
              </div>
            </div>

            <Textarea
              label="Bio"
              value={profile.bio}
              onChange={(e) => updateBio(e.target.value)}
              minRows={3}
              error={errors.bio}
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
  );
}
