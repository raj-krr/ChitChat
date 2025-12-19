import { useState } from "react";
import { Button, TextInput, PasswordInput, Group, Text } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { loginApi } from "../../apis/auth.api";
import { useAuth } from "../../context/AuthContext";


const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernameRegex = /^[a-zA-Z0-9._-]+$/;
const passwordRegex = /^[\x20-\x7E]+$/;

export default function LoginPage() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const [identifierError, setIdentifierError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const validateInputs = () => {
    let isValid = true;

    setIdentifierError("");
    setPasswordError("");

    if (!identifier.trim()) {
      setIdentifierError("Identifier is required");
      isValid = false;
    } else if (identifier.length > 50) {
      setIdentifierError("Maximum length is 50 characters");
      isValid = false;
    } else if (identifier.includes("@")) {
      if (!emailRegex.test(identifier)) {
        setIdentifierError("Invalid email format");
        isValid = false;
      }
    } else {
      if (!usernameRegex.test(identifier)) {
        setIdentifierError("Username cannot contain spaces or emojis");
        isValid = false;
      }
    }

    if (!password.trim()) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (password.length > 20) {
      setPasswordError("Password must be 20 characters max");
      isValid = false;
    } else if (!passwordRegex.test(password)) {
      setPasswordError("Password contains invalid characters");
      isValid = false;
    }

    return isValid;
  };
const { refreshAuth } = useAuth();
  const handleLogin = async () => {
 
    if (!validateInputs()) return;

    try {
      await loginApi({ identifier, password });
         await refreshAuth();
    } catch (err: any) {
      const msg = err.response?.data?.msg;

      if (msg === "wrong password") {
        setPasswordError("Incorrect password");
      } else if (msg === "User not found") {
        setIdentifierError("No user exists with this identifier");
      } else if (msg?.includes("email not verified yet")) {
        setPasswordError("Email not verified yet.");
      }
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
      {/* Background grid */}
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none"></div>

      {/* Glass Login Card */}
      <div
        className="
          w-full max-w-lg rounded-3xl p-8
          backdrop-blur-2xl bg-white/30 border border-white/40 shadow-xl
          fade-in glow-hover tilt-hover
          relative z-10
        "
      >
        {/* Title */}
        <h1
          className="
            mb-6 text-4xl sm:text-5xl font-extrabold text-indigo-900 text-center
            drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]
          "
        >
          Welcome Back 
        </h1>

        {/* Input Fields */}
        <div className="space-y-4">
          <TextInput
            label="Email or Username"
            placeholder="Enter email or username"
            radius="md"
            size="md"
            value={identifier}
            onChange={(e) => {
              const val = e.target.value;
              if (val.length <= 50) setIdentifier(val);
            }}
            error={
              identifierError && (
                <span className="text-red-600 text-sm error-fade">
                  {identifierError}
                </span>
              )
            }
            className={
              identifierError
                ? "input-error"
                : identifier && !identifierError
                ? "input-valid"
                : ""
            }
          />

          <PasswordInput
            label="Password"
            placeholder="Enter your password"
            radius="md"
            size="md"
            value={password}
            onChange={(e) => {
              const val = e.target.value;
              if (val.length <= 20) setPassword(val);
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

        {/* Login Button */}
        <Group grow className="mt-6">
          <Button
            size="lg"
            radius="lg"
            color="indigo"
            className="
              transition-all duration-300 
              hover:shadow-xl hover:-translate-y-1 transform-gpu
            "
            onClick={handleLogin}
          >
            Login
          </Button>
        </Group>

        {/* Links */}
        <div className="mt-5 text-center text-sm text-gray-800">
          <button
            className="underline hover:text-indigo-900 transition"
            onClick={() => navigate("/forgot-password")}
          >
            Forgot Password?
          </button>

          <div className="mt-2">
            <Text>
              Don’t have an account?{" "}
              <button
                onClick={() => navigate("/register")}
                className="text-indigo-900 font-semibold underline hover:opacity-80"
              >
                Create one
              </button>
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}
