import { useEffect, useState } from "react";
import { socket } from "../../apis/socket";
import { useGlobalCall } from "../../context/CallContext";
import { useCall } from "./hooks/useCall";

export default function CallWindow() {
  const callSocket = useGlobalCall();
  const { remoteVideoRef, localVideoRef, remoteAudioRef } = useGlobalCall();

  const call = useCall(remoteVideoRef, localVideoRef, remoteAudioRef);

  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const isVideo = callSocket.callType === "video";
  const isActive =
    callSocket.callStatus === "calling" ||
    callSocket.callStatus === "connected";

  // ⏱ TIMER
  useEffect(() => {
    if (callSocket.callStatus !== "connected") return;

    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [callSocket.callStatus]);

  useEffect(() => {
    if (
      callSocket.callStatus === "calling" &&
      callSocket.callUser &&
      !callSocket.activeCallUserId
    ) {
      call.startCall(
        callSocket.callUser._id,
        callSocket.callUser,
        callSocket.callType
      );
    }
  }, [callSocket.callStatus, callSocket.callUser]);

  // 🔁 RESET
  useEffect(() => {
    if (callSocket.callStatus === "idle") {
      setSeconds(0);
      setIsMuted(false);
    }
  }, [callSocket.callStatus]);

  const handleMute = () => {
    const muted = call.toggleMute();
    setIsMuted(muted);
  };

  const handleEnd = () => {
    call.endCall();
  };

  const handleAccept = async () => {
    await call.acceptCall(
      callSocket.incomingCall.from,
      callSocket.incomingCall.offer,
      callSocket.incomingCall.type
    );

    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = false;
      remoteAudioRef.current.volume = 1;
      await remoteAudioRef.current.play().catch(() => {
        console.log("manual play failed");
      });
    }

    callSocket.setIncomingCall(null);
  };

  const handleReject = () => {
    socket.emit("reject-call", { to: callSocket.incomingCall.from });
    callSocket.setIncomingCall(null);
  };

  return (
    <>
      {/*
        ✅ ALL 3 MEDIA ELEMENTS are ALWAYS in the DOM — never conditionally rendered.
        We only toggle visibility with CSS.
      */}

      {/* 🔊 AUDIO — always hidden, always mounted */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        style={{ display: "none" }}
      />

      {/* 🎥 REMOTE VIDEO — hidden unless active video call */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        style={
          isActive && isVideo
            ? {
                position: "fixed",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                zIndex: 50,
              }
            : { display: "none" }
        }
      />

      {/* 📷 LOCAL VIDEO — hidden unless active video call */}
      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        style={
          isActive && isVideo
            ? {
                position: "fixed",
                bottom: "24px",
                right: "24px",
                width: "128px",
                height: "176px",
                objectFit: "cover",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.3)",
                zIndex: 51,
              }
            : { display: "none" }
        }
      />

      {/* 📞 INCOMING CALL UI */}
      {callSocket.incomingCall && (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white z-50">
          <img
            src={callSocket.callUser?.avatar || "/avatar-placeholder.png"}
            className="w-28 h-28 rounded-full mb-4"
          />

          <h2 className="text-2xl font-semibold">
            {callSocket.callUser?.username}
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
      )}

      {/* 📡 ACTIVE CALL UI — overlay for controls and user info */}
      {isActive && (
        <div className="fixed inset-0 text-white z-50"
          style={{ background: isVideo ? "transparent" : "black" }}
        >
          {/* 👤 USER INFO */}
          <div className="absolute top-12 left-0 right-0 text-center">
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
          <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-8">
            <button
              onClick={handleMute}
              className={`p-4 rounded-full ${
                isMuted ? "bg-red-500" : "bg-white/20"
              }`}
            >
              {isMuted ? "🔕" : "🎤"}
            </button>

            <button
              onClick={handleEnd}
              className="bg-red-500 p-5 rounded-full"
            >
              📞
            </button>
          </div>
        </div>
      )}
    </>
  );
}