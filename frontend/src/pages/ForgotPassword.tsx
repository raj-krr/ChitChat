import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPasswordApi } from "../apis/auth.api";
import { Button, TextInput, Text } from "@mantine/core";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernameRegex = /^[a-zA-Z0-9._-]+$/;

export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const validateIdentifier = () => {
    setError("");

    if (!identifier.trim()) {
      setError("Email or username is required");
      return false;
    }

    if (identifier.length > 50) {
      setError("Maximum length is 50 characters");
      return false;
    }

    // treat as email if contains "@"
    if (identifier.includes("@")) {
      if (!emailRegex.test(identifier)) {
        setError("Invalid email format");
        return false;
      }
    } else {
      // treat as username
      if (!usernameRegex.test(identifier)) {
        setError("Invalid username format");
        return false;
      }
    }

    return true;
  };

  const handleForgot = async () => {
    if (!validateIdentifier()) return;

    try {
      setLoading(true);
      await forgotPasswordApi({ identifier });

      navigate("/reset-password?identifier=" + encodeURIComponent(identifier));
    } catch (err: any) {
      setError(err.response?.data?.msg || "Error sending OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6 relative overflow-hidden">

      {/* Background grid */}
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none"></div>

      {/* Glass card */}
      <div
        className="
          w-full max-w-lg rounded-3xl p-8
          backdrop-blur-2xl bg-white/30 border border-white/40 shadow-xl 
          fade-in glow-hover tilt-hover
          relative z-10
          flex flex-col gap-6
        "
      >
        <h1
          className="
            text-4xl sm:text-5xl font-extrabold text-indigo-900 text-center
            drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]
          "
        >
          Forgot Password 🔑
        </h1>

        <Text className="text-center text-gray-900">
          Enter your <b>email or username</b> to receive an OTP.
        </Text>

        <div className="flex flex-col">
          <TextInput
            label="Email or Username"
            placeholder="your@email.com or username"
            radius="md"
            size="md"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            error={error ? <span className="text-red-600 text-sm">{error}</span> : null}
            className={
              error
                ? "input-error"
                : identifier && !error
                ? "input-valid"
                : ""
            }
          />
        </div>

        <Button
          size="lg"
          radius="lg"
          color="indigo"
          fullWidth
          onClick={handleForgot}
          loading={loading}
          disabled={loading}
          className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1 transform-gpu"
        >
          Send OTP
        </Button>

        <Text className="text-center text-sm text-gray-800">
          Remember your password?{" "}
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
