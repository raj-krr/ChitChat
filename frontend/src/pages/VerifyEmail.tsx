import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { verifyEmailApi, resendVerificationOtpApi } from "../apis/auth.api";
import { Button, Text } from "@mantine/core";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const email: string = searchParams.get("email") ?? "";

  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [otpError, setOtpError] = useState<string>("");

  const [timer, setTimer] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [resendLoading, setResendLoading] = useState<boolean>(false);

  // Countdown Timer
  useEffect(() => {
    if (timer === 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Handle OTP Changes
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otpDigits];
    newOtp[index] = value.slice(-1);
    setOtpDigits(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (index: number, value: string) => {
    if (value === "" && index > 0) {
      const newOtp = [...otpDigits];
      newOtp[index - 1] = "";
      setOtpDigits(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePasteOtp = (e: React.ClipboardEvent<HTMLDivElement>) => {
  e.preventDefault();
  const paste = e.clipboardData.getData("text").trim();

  if (!/^\d{6}$/.test(paste)) return;

  const newOtp = paste.split("");
  setOtpDigits(newOtp);

  // Focus last box
  inputRefs.current[5]?.focus();
};

  const handleVerify = async () => {
    setOtpError("");

    const otpString = otpDigits.join("");
    if (otpString.length !== 6) {
      setOtpError("OTP must be 6 digits");
      return;
    }

    try {
      setLoading(true);
      await verifyEmailApi({ email, verificationCode: otpString });
      navigate("/login");
    } catch (err: any) {
      const msg = err.response?.data?.msg || "Invalid OTP";
      setOtpError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setOtpError("");

    try {
      setResendLoading(true);
      await resendVerificationOtpApi({ email });
      setTimer(30);
    } catch (err: any) {
      const msg = err.response?.data?.msg || "Failed to resend OTP";
      setOtpError(msg);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6 relative overflow-hidden">

      {/* Background grid */}
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none"></div>

      {/* GLASS CARD */}
      <div
        className="
          w-full max-w-lg rounded-3xl p-8
          backdrop-blur-2xl bg-white/30 border border-white/40 shadow-xl
          relative z-10
          flex flex-col items-center gap-6
        "
      >
        {/* TITLE */}
        <div className="text-center">
          <h1
            className="
              text-4xl sm:text-5xl font-extrabold text-indigo-900
              drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]
            "
          >
            Verify Email 🔐
          </h1>

          <Text className="text-gray-900 mt-4">
            An OTP has been sent to <span className="font-semibold">{email}</span>
          </Text>
        </div>

       {/* OTP Section */}
<div className="w-full flex flex-col items-center gap-5 mt-4">

  {/* Enter OTP label */}
  <label className="text-sm font-semibold text-gray-900">
    Enter OTP
  </label>

  {/* OTP Boxes */}
  <div className="flex gap-3 justify-center"
       onPaste={(e) => handlePasteOtp(e)}>
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
          w-12 h-14 sm:w-14 sm:h-16
          text-center text-2xl font-semibold
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

  {/* Error slot */}
  <div className="min-h-[20px]">
    {otpError && <span className="text-red-600 text-sm">{otpError}</span>}
  </div>

</div>


        {/* VERIFY BUTTON */}
        <Button
          size="lg"
          radius="lg"
          color="indigo"
          fullWidth
          onClick={handleVerify}
          loading={loading}
          disabled={loading}
          className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
        >
          Verify Email
        </Button>

        {/* RESEND BUTTON */}
        {timer > 0 ? (
          <Button size="md" radius="lg" variant="outline" fullWidth disabled>
            Resend OTP in {timer}s
          </Button>
        ) : (
          <Button
            size="md"
            radius="lg"
            variant="outline"
            fullWidth
            onClick={handleResend}
            loading={resendLoading}
          >
            Resend OTP
          </Button>
        )}

        {/* LOGIN LINK */}
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
