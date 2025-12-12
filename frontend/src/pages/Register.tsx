import { useState } from "react";
import { Button, TextInput, PasswordInput, Text } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { registerApi } from "../apis/auth.api";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernameRegex = /^[a-zA-Z0-9._-]{3,30}$/;
const passwordRegex = /^[\x20-\x7E]{6,20}$/;

export default function RegisterPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [loading, setLoading] = useState(false);

  const validateInputs = () => {
    let ok = true;

    setUsernameError("");
    setEmailError("");
    setPasswordError("");

    // Username
    if (!username.trim()) {
      setUsernameError("Username is required");
      ok = false;
    } else if (username.length < 3) {
      setUsernameError("Username must be at least 3 characters");
      ok = false;
    } else if (username.length > 30) {
      setUsernameError("Maximum length is 30 characters");
      ok = false;
    } else if (!usernameRegex.test(username)) {
      setUsernameError("Username can contain letters, numbers, . _ - only");
      ok = false;
    }

    // Email
    if (!email.trim()) {
      setEmailError("Email is required");
      ok = false;
    } else if (email.length > 100) {
      setEmailError("Maximum email length is 100 characters");
      ok = false;
    } else if (!emailRegex.test(email)) {
      setEmailError("Invalid email format");
      ok = false;
    }

    // Password
    if (!password.trim()) {
      setPasswordError("Password is required");
      ok = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      ok = false;
    } else if (password.length > 20) {
      setPasswordError("Password must be 20 characters max");
      ok = false;
    } else if (!passwordRegex.test(password)) {
      setPasswordError("Password contains invalid characters");
      ok = false;
    }

    return ok;
  };

  const handleRegister = async () => {
    if (!validateInputs()) return;

    try {
      setLoading(true);
      await registerApi({
        username: username.trim(),
        email: email.trim(),
        password,
      });

      navigate(`/verify-email?email=${email.trim()}`);
    } catch (err: any) {
      const msg = err?.response?.data?.msg || "";

      if (msg.toLowerCase().includes("username")) {
        setUsernameError(msg);
      } else if (msg.toLowerCase().includes("email")) {
        setEmailError(msg);
      } else {
        setPasswordError(msg || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="
        min-h-screen flex items-center justify-center 
        bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500
        chitchat-bg
        p-6 relative overflow-hidden
      "
    >
      {/* Background Grid */}
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none"></div>

      {/* Glass Card */}
      <div
        className="
          w-full max-w-lg rounded-3xl p-8
          backdrop-blur-2xl bg-white/30 border border-white/40 shadow-xl
          fade-in glow-hover tilt-hover
          relative z-10 flex flex-col gap-6
        "
      >
        <h1
          className="
            text-4xl sm:text-5xl font-extrabold text-indigo-900 text-center
            drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]
          "
        >
          Create Account ✨
        </h1>

        <Text className="text-center text-gray-900 mb-2">
          Join ChitChat — fast, modern & beautiful.
        </Text>

        {/* INPUTS */}
        <div className="space-y-4">
          {/* Username */}
          <TextInput
            label="Username"
            placeholder="your_username"
            radius="md"
            size="md"
            value={username}
            onChange={(e) => {
              const v = e.target.value;
              if (v.length <= 30) setUsername(v);
            }}
            error={
              usernameError && (
                <span className="text-red-600 text-sm error-fade">
                  {usernameError}
                </span>
              )
            }
            className={
              usernameError
                ? "input-error"
                : username && !usernameError
                ? "input-valid"
                : ""
            }
          />

          {/* Email */}
          <TextInput
            label="Email"
            placeholder="you@example.com"
            radius="md"
            size="md"
            value={email}
            onChange={(e) => {
              const v = e.target.value;
              if (v.length <= 100) setEmail(v);
            }}
            error={
              emailError && (
                <span className="text-red-600 text-sm error-fade">
                  {emailError}
                </span>
              )
            }
            className={
              emailError ? "input-error" : email && !emailError ? "input-valid" : ""
            }
          />

          {/* Password */}
          <PasswordInput
            label="Password"
            placeholder="Create a password"
            radius="md"
            size="md"
            value={password}
            onChange={(e) => {
              const v = e.target.value;
              if (v.length <= 20) setPassword(v);
            }}
            error={
              passwordError && (
                <span className="text-red-600 text-sm error-fade">
                  {passwordError}
                </span>
              )
            }
            className={
              passwordError
                ? "input-error"
                : password && !passwordError
                ? "input-valid"
                : ""
            }
          />
        </div>

        {/* Submit */}
        <Button
          size="lg"
          radius="lg"
          color="indigo"
          fullWidth
          onClick={handleRegister}
          loading={loading}
          disabled={loading}
          className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
        >
          Create Account
        </Button>

        {/* Bottom link */}
        <Text className="text-center text-sm text-gray-800">
          Already have an account?{" "}
          <button
            className="text-indigo-900 font-semibold underline hover:opacity-80"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        </Text>
      </div>
    </div>
  );
}
