import { useSearchParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { forgotPasswordApi, resetPasswordApi } from "../apis/auth.api";
import { Button, PasswordInput, Text } from "@mantine/core";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const identifier = searchParams.get("identifier") ?? "";

  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [otpError, setOtpError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [newPassword, setNewPassword] = useState("");

  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // --- Timer countdown ---
  useEffect(() => {
    if (timer === 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // --- OTP Input Change ---
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otpDigits];
    newOtp[index] = value.slice(-1);
    setOtpDigits(newOtp);

    if (value !== "" && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleBackspace = (index: number, value: string) => {
    if (value === "" && index > 0) {
      const newOtp = [...otpDigits];
      newOtp[index - 1] = "";
      setOtpDigits(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  };

  // --- Paste full OTP ---
  const handlePasteOtp = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").trim();
    if (!/^\d{6}$/.test(paste)) return;

    setOtpDigits(paste.split(""));
    inputRefs.current[5]?.focus();
  };

  // --- Validation ---
  const validateInputs = () => {
    let ok = true;
    setOtpError("");
    setPasswordError("");

    if (otpDigits.join("").length !== 6) {
      setOtpError("OTP must be 6 digits");
      ok = false;
    }

    if (!newPassword.trim()) {
      setPasswordError("Password is required");
      ok = false;
    } else if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      ok = false;
    }

    return ok;
  };

  // --- Submit Reset Password ---
  const handleReset = async () => {
    if (!validateInputs()) return;

    try {
      setLoading(true);
      await resetPasswordApi({
        identifier,
        resetPasswordOtp: otpDigits.join(""),
        newPassword,
      });

      navigate("/login");
    } catch (err: any) {
      const msg = err.response?.data?.msg || "Reset failed";
      setPasswordError(msg);
    } finally {
      setLoading(false);
    }
  };

  // --- Resend OTP ---
  const handleResend = async () => {
    setOtpError("");
    try {
      setResendLoading(true);
      await forgotPasswordApi({ identifier });
      setTimer(30);
    } catch {
      setOtpError("Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none"></div>

      {/* WRAPPER CARD */}
      <div
        className="
          w-full max-w-lg rounded-3xl p-6 sm:p-8
          backdrop-blur-2xl bg-white/30 border border-white/40 shadow-xl
          relative z-10 flex flex-col gap-6
        "
      >
        <h1
          className="
            text-3xl sm:text-5xl font-extrabold text-indigo-900 text-center
            drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]
          "
        >
          Reset Password 🔄
        </h1>

        <Text className="text-center text-gray-900 text-sm sm:text-base">
          OTP has been sent to <b>{identifier}</b>
        </Text>

        {/* OTP SECTION */}
        <div className="flex flex-col items-center gap-3 sm:gap-4">
          <label className="text-sm font-semibold text-gray-900">
            Enter OTP
          </label>

          {/* OTP BOXES */}
          <div
            className="flex gap-2 sm:gap-3 justify-center"
            onPaste={handlePasteOtp}
          >
            {otpDigits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                className="
                  w-10 h-12 sm:w-14 sm:h-16
                  text-center text-xl sm:text-2xl font-semibold
                  rounded-xl bg-white/40 backdrop-blur border border-white/60
                  focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500
                  transition-all
                "
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace') handleBackspace(i, digit);
                }}
              />
            ))}
          </div>

          {/* Error */}
          <div className="min-h-[18px]">
            {otpError && <span className="text-red-600 text-sm">{otpError}</span>}
          </div>

          {/* RESEND OTP text */}
          <Text className="text-sm text-gray-900">
            Didn’t receive OTP?{" "}
            {timer > 0 ? (
              <span className="font-semibold text-indigo-900">
                Resend in {timer}s
              </span>
            ) : (
                <button
                  className="font-semibold text-indigo-900 underline disabled:opacity-50"
                  onClick={handleResend}
                  disabled={resendLoading}
                >
                  {resendLoading ? "Sending..." : "Resend OTP"}
                </button>

            )}
          </Text>
        </div>

        {/* NEW PASSWORD */}
        <PasswordInput
          label="New Password"
          placeholder="Enter new password"
          radius="md"
          size="md"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          error={passwordError && <span className="text-red-600">{passwordError}</span>}
          className={
            passwordError
              ? "input-error"
              : newPassword && !passwordError
              ? "input-valid"
              : ""
          }
        />

        {/* RESET BUTTON */}
        <Button
          size="lg"
          radius="lg"
          color="indigo"
          fullWidth
          onClick={handleReset}
          loading={loading}
          className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
        >
          Reset Password
        </Button>

        <Text className="text-center text-sm text-gray-800">
          Back to{" "}
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
