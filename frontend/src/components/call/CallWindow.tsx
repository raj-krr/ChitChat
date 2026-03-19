import { useEffect, useState } from "react";
import { socket } from "../../apis/socket";
import { useGlobalCall } from "../../context/CallContext";
import { useCall } from "./hooks/useCall";

export default function CallWindow() {
  const callSocket = useGlobalCall();
  const call = useCall();

  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // ⏱️ TIMER
  useEffect(() => {
    if (callSocket.callStatus !== "connected") return;

    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [callSocket.callStatus]);

  // 🔁 RESET
  useEffect(() => {
    if (callSocket.callStatus === "idle") {
      setSeconds(0);
      setIsMuted(false);
    }
  }, [callSocket.callStatus]);

  // 🎤 MUTE
  const handleMute = () => {
    const muted = call.toggleMute();
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

  // 📞 INCOMING
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
            className="bg-green-500 px-6 py-3 rounded-full"
          >
            Accept
          </button>

          <button
            onClick={handleReject}
            className="bg-red-500 px-6 py-3 rounded-full"
          >
            Reject
          </button>
        </div>
      </div>
    );
  }

  // 📡 CALLING + CONNECTED
  if (
    callSocket.callStatus === "calling" ||
    callSocket.callStatus === "connected"
  ) {
    return (
      <div className="fixed inset-0 bg-black text-white z-50">

        {/* 🎥 REMOTE VIDEO */}
        <video
          id="remote-video"
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* 🎥 LOCAL VIDEO */}
        <video
          id="local-video"
          autoPlay
          muted
          playsInline
          className="absolute bottom-6 right-6 w-32 h-44 rounded-xl border border-white/30 object-cover z-50"
        />

        {/* 👤 USER INFO */}
        <div className="absolute top-12 left-0 right-0 text-center z-50">
          <h2 className="text-xl font-semibold">
            {callSocket.callUser?.username}
          </h2>

          <p className="text-white/70 text-sm">
            {callSocket.callStatus === "calling"
              ? "Calling..."
              : `${Math.floor(seconds / 60)}:${String(
                  seconds % 60
                ).padStart(2, "0")}`}
          </p>
        </div>

        {/* 🎛 CONTROLS */}
        <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-8 z-50">

          {/* 🔇 MUTE */}
          <button
            onClick={handleMute}
            className={`p-4 rounded-full ${
              isMuted ? "bg-red-500" : "bg-white/20"
            }`}
          >
            {isMuted ? "🔕" : "🎤"}
          </button>

          {/* 🔊 SPEAKER */}
          <button
            onClick={handleSpeaker}
            className="bg-white/20 p-4 rounded-full"
          >
            🔊
          </button>

          {/* ❌ END */}
          <button
            onClick={handleEnd}
            className="bg-red-500 p-5 rounded-full"
          >
            📞
          </button>

        </div>
      </div>
    );
  }

  return null;
}