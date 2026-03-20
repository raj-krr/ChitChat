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

// ⏱ TIMER
useEffect(() => {
if (callSocket.callStatus !== "connected") return;


const interval = setInterval(() => {
  setSeconds((s) => s + 1);
}, 1000);

return () => clearInterval(interval);


}, [callSocket.callStatus]);
  
  useEffect(() => {
  if (callSocket.callStatus === "calling" && callSocket.callUser) {
    call.startCall(
      callSocket.callUser._id,
      callSocket.callUser,
      callSocket.callType
    );
  }
}, [callSocket.callStatus,callSocket.callUser]);

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

const handleEnd = () => {
call.endCall();
};

// ✅ ACCEPT CALL
const handleAccept = async () => {
  await call.acceptCall(
    callSocket.incomingCall.from,
    callSocket.incomingCall.offer,
    callSocket.incomingCall.type
  );

  // 🔥 USER INTERACTION UNLOCK
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
socket.emit("reject-call", {
to: callSocket.incomingCall.from,
});

callSocket.setIncomingCall(null);

};

// 📞 INCOMING CALL UI
if (callSocket.incomingCall) {
return ( <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white z-50">
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
);

}

// 📡 ACTIVE CALL UI
if (
callSocket.callStatus === "calling" ||
callSocket.callStatus === "connected"
) {
return ( <div className="fixed inset-0 bg-black text-white z-50">
{/* 🎥 VIDEO MODE */}
{isVideo && (
<> <video
           ref={remoteVideoRef}
           autoPlay
           playsInline
           className="absolute inset-0 w-full h-full object-cover"
         />


        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="absolute bottom-6 right-6 w-32 h-44 rounded-xl border border-white/30 object-cover"
        />
      </>
    )}

    {/* 🔊 AUDIO ELEMENT (always present) */}
    <audio
      ref={remoteAudioRef}
      autoPlay
      playsInline
    />

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
);

}

return null;
}
