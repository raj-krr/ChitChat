import { useEffect, useState } from "react";
import { socket } from "../../apis/socket";
import { useGlobalCall } from "../../context/CallContext";
import { useCall } from "./hooks/useCall";

export default function CallWindow() {
  const callSocket = useGlobalCall();
  const call = useCall();

  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (callSocket.callStatus !== "connected") return;

    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [callSocket.callStatus]);

  useEffect(() => {
    if (callSocket.callStatus === "idle") {
      setSeconds(0);
      setIsMuted(false); //  reset mute also
    }
  }, [callSocket.callStatus]);

  const handleMute = () => {
    const muted = call.toggleMute(); //  use returned value
    setIsMuted(muted);
  };

  const handleSpeaker = () => {
    call.toggleSpeaker();
  };

  const handleEnd = () => {
    call.endCall();
  };

  const handleAccept = () => {
    call.acceptCall(
      callSocket.incomingCall.from,
      callSocket.incomingCall.offer
    );
    callSocket.setIncomingCall(null);
  };

  const handleReject = () => {
    socket.emit("reject-call", {
      to: callSocket.incomingCall.from,
    });
    callSocket.setIncomingCall(null);
  };

  if (callSocket.incomingCall) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white z-50">

        <img
          src={callSocket.callUser?.avatar || "/avatar-placeholder.png"}
          className="w-28 h-28 rounded-full mb-4 border-4 border-white/20"
        />

        <h2 className="text-2xl font-semibold">
          {callSocket.callUser?.username || "Unknown"}
        </h2>

        <p className="text-white/60 mt-2">Incoming Call 📞</p>

        <div className="flex gap-10 mt-8">
          <button
            onClick={handleAccept}
            className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-full transition"
          >
            Accept
          </button>

          <button
            onClick={handleReject}
            className="bg-red-500 hover:bg-red-600 px-6 py-3 rounded-full transition"
          >
            Reject
          </button>
        </div>
      </div>
    );
  }

  if (
    callSocket.callStatus === "calling" ||
    callSocket.callStatus === "connected"
  ) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white flex flex-col items-center justify-between py-16 z-50">

        {/* 👤 USER */}
        <div className="text-center">
          <img
            src={callSocket.callUser?.avatar || "/avatar-placeholder.png"}
            className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-white/20 shadow-lg"
          />

          <h2 className="text-2xl font-semibold">
            {callSocket.callUser?.username}
          </h2>

          <p className="text-white/60 mt-2">
            {callSocket.callStatus === "calling"
              ? "Calling..."
              : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`}
          </p>
        </div>

        {/* 📡 CONNECTION STATUS */}
        <div className="flex flex-col items-center">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-ping mb-2" />
          <p className="text-xs text-white/50">
            {callSocket.callStatus === "connected"
              ? "Connected"
              : "Connecting..."}
          </p>
        </div>

        {/* 🎛 CONTROLS */}
        <div className="flex gap-12">

          {/*  MUTE */}
          <button
            onClick={handleMute}
            className={`p-5 rounded-full transition-all duration-200 ${
              isMuted
                ? "bg-red-500 scale-110"
                : "bg-white/10 hover:bg-white/20"
            }`}
          >
            {isMuted ? "🔕" : "🎤"}
          </button>

          {/*  SPEAKER */}
          <button
            onClick={handleSpeaker}
            className="bg-white/10 hover:bg-white/20 p-5 rounded-full transition"
          >
            🔊
          </button>

          {/*  END */}
          <button
            onClick={handleEnd}
            className="bg-red-500 hover:bg-red-600 p-6 rounded-full transition scale-110"
          >
            📞
          </button>

        </div>
      </div>
    );
  }

  return null;
}