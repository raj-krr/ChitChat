import { useEffect, useState } from "react";
import { socket } from "../../apis/socket";
import { useGlobalCall } from "../../context/CallContext";
import { useCall } from "./hooks/useCall";
import { PhoneOff, PhoneMissed } from "lucide-react";

export default function CallWindow() {
  const callSocket = useGlobalCall();
  const { remoteVideoRef, localVideoRef, remoteAudioRef } = useGlobalCall();
  const call = useCall(remoteVideoRef, localVideoRef, remoteAudioRef);

  const [seconds,          setSeconds]          = useState(0);
  const [isMuted,          setIsMuted]          = useState(false);
  const [isSpeakerMuted,   setIsSpeakerMuted]   = useState(false);

  const isVideo     = callSocket.callType === "video";
  const isActive    = callSocket.callStatus === "calling" || callSocket.callStatus === "connected";
  const isConnected = callSocket.callStatus === "connected";

  const remoteUser   = callSocket.callUser;
  const remoteName   = remoteUser?.username || remoteUser?.name || "Unknown";
  const remoteAvatar = remoteUser?.avatar || "/avatar-placeholder.png";

  useEffect(() => {
    if (!isConnected) return;
    const iv = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(iv);
  }, [isConnected]);

  useEffect(() => {
    if (
      callSocket.callStatus === "calling" &&
      callSocket.callUser &&
      !callSocket.activeCallUserId
    ) {
      call.startCall(callSocket.callUser._id, callSocket.callUser, callSocket.callType);
      callSocket.startMissedTimer(callSocket.callUser._id, remoteName);
    }
  }, [callSocket.callStatus, callSocket.callUser]);

  useEffect(() => {
    if (callSocket.callStatus === "idle") {
      setSeconds(0);
      setIsMuted(false);
      setIsSpeakerMuted(false);
    }
  }, [callSocket.callStatus]);

  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const handleMute    = () => setIsMuted(call.toggleMute());
  const handleSpeaker = () => setIsSpeakerMuted(call.toggleSpeaker());
  const handleEnd     = () => { callSocket.clearMissedTimer(); call.endCall(); };

  const handleAccept = async () => {
    callSocket.stopAllAudio();
    await call.acceptCall(
      callSocket.incomingCall.from,
      callSocket.incomingCall.offer,
      callSocket.incomingCall.type,
    );
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted  = false;
      remoteAudioRef.current.volume = 1;
      await remoteAudioRef.current.play().catch(() => {});
    }
    callSocket.setIncomingCall(null);
  };

  const handleReject = () => {
    callSocket.stopAllAudio();
    socket.emit("reject-call", { to: callSocket.incomingCall.from });
    callSocket.setIncomingCall(null);
    callSocket.setCallStatus("idle");
  };

  return (
    <>
      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: "none" }} />

      <video
        ref={remoteVideoRef} autoPlay playsInline
        style={isActive && isVideo
          ? { position: "fixed", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 50 }
          : { display: "none" }}
      />
      <video
        ref={localVideoRef} autoPlay muted playsInline
        style={isActive && isVideo
          ? { position: "fixed", bottom: "calc(env(safe-area-inset-bottom,0px) + 110px)", right: 16, width: 110, height: 160, objectFit: "cover", borderRadius: 14, border: "2px solid rgba(255,255,255,0.25)", zIndex: 52, boxShadow: "0 4px 24px rgba(0,0,0,0.5)" }
          : { display: "none" }}
      />

      {/* ── MISSED CALL TOAST ── */}
      {callSocket.missedCallMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-5 py-3 rounded-2xl bg-[#1a1a2e] border border-white/10 shadow-2xl animate-fade-in">
          <PhoneMissed size={18} className="text-red-400 shrink-0" />
          <span className="text-white text-sm font-medium">{callSocket.missedCallMsg}</span>
        </div>
      )}

      {/* ── INCOMING CALL — shown EVERYWHERE via CallProvider ── */}
      {callSocket.incomingCall && (
        <IncomingCallOverlay
          remoteName={remoteName}
          remoteAvatar={remoteAvatar}
          callType={callSocket.callType}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      )}

      {/* ── ACTIVE CALL UI ── */}
      {isActive && (
        <div
          className="fixed inset-0 text-white z-50 flex flex-col"
          style={{ background: isVideo ? "transparent" : "linear-gradient(160deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)" }}
        >
          <div className="flex flex-col items-center pt-14 pb-4">
            {!isVideo && (
              <div className="relative mb-5">
                <img src={remoteAvatar} className="w-24 h-24 rounded-full object-cover border-4 border-white/20 shadow-2xl" />
                {isConnected && <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />}
              </div>
            )}
            <h2 className="text-2xl font-bold tracking-tight">{remoteName}</h2>
            <div className="mt-2 flex items-center gap-2">
              {isConnected ? (
                <>
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-green-400 text-sm font-medium">{fmt(seconds)}</span>
                </>
              ) : (
                <span className="text-white/50 text-sm animate-pulse">Calling {remoteName}…</span>
              )}
            </div>
          </div>

          <div className="flex-1" />

          <div className="px-8" style={{ paddingBottom: "calc(env(safe-area-inset-bottom,16px) + 24px)" }}>
            <div className="flex justify-center gap-3 mb-6">
              {isMuted && <Pill color="red">🔇 Muted</Pill>}
              {isSpeakerMuted && <Pill color="yellow">🔈 Speaker off</Pill>}
            </div>

            <div className="flex justify-center items-center gap-5">
              <ControlBtn label={isMuted ? "Unmute" : "Mute"} active={isMuted} onClick={handleMute} icon={<MicIcon muted={isMuted} />} />
              <ControlBtn label={isSpeakerMuted ? "Unmute" : "Speaker"} active={isSpeakerMuted} onClick={handleSpeaker} icon={<SpeakerIcon muted={isSpeakerMuted} />} />

              {/* END */}
              <button onClick={handleEnd} className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-400 active:scale-95 transition-all flex items-center justify-center shadow-xl shadow-red-500/40">
                <PhoneOff size={26} className="text-white" />
              </button>

              {isVideo
                ? <ControlBtn label="Flip" active={false} onClick={() => call.switchCamera()} icon={<FlipIcon />} />
                : <div className="w-12 h-12" />}
              {!isVideo && <div className="w-12 h-12" />}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function IncomingCallOverlay({ remoteName, remoteAvatar, callType, onAccept, onReject }: any) {
  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center"
      style={{ background: "linear-gradient(160deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)", paddingBottom: "env(safe-area-inset-bottom,0px)" }}
    >
      <div className="relative flex items-center justify-center mb-8">
        <span className="absolute w-36 h-36 rounded-full bg-white/5 animate-ping" style={{ animationDuration: "1.5s" }} />
        <span className="absolute w-28 h-28 rounded-full bg-white/10 animate-ping" style={{ animationDuration: "1.5s", animationDelay: "0.3s" }} />
        <img src={remoteAvatar} className="w-24 h-24 rounded-full object-cover border-4 border-white/20 shadow-2xl relative z-10" />
      </div>

      <p className="text-white/60 text-sm font-medium tracking-widest uppercase mb-2">
        Incoming {callType} call
      </p>
      <h2 className="text-white text-3xl font-bold mb-10">{remoteName}</h2>

      <div className="flex gap-16">
        <CallActionBtn color="red" label="Decline" onClick={onReject}>
          <PhoneOff size={26} className="text-white" />
        </CallActionBtn>
        <CallActionBtn color="green" label="Accept" onClick={onAccept}>
          <PhoneIcon />
        </CallActionBtn>
      </div>
    </div>
  );
}

function CallActionBtn({ color, label, onClick, children }: any) {
  const bg = color === "red" ? "bg-red-500 hover:bg-red-400 shadow-red-500/30" : "bg-green-500 hover:bg-green-400 shadow-green-500/30";
  return (
    <div className="flex flex-col items-center gap-2">
      <button onClick={onClick} className={`w-16 h-16 rounded-full ${bg} active:scale-95 transition-all flex items-center justify-center shadow-lg`}>
        {children}
      </button>
      <span className="text-white/50 text-xs">{label}</span>
    </div>
  );
}

function Pill({ color, children }: any) {
  const cls = color === "red"
    ? "bg-red-500/20 border-red-500/40 text-red-400"
    : "bg-yellow-500/20 border-yellow-500/40 text-yellow-400";
  return <span className={`px-3 py-1 rounded-full border text-xs font-medium ${cls}`}>{children}</span>;
}

function ControlBtn({ icon, label, active, onClick }: any) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button onClick={onClick} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 ${active ? "bg-red-500/20 text-red-400 border border-red-500/40" : "bg-white/10 text-white hover:bg-white/20 border border-white/10"}`}>
        {icon}
      </button>
      <span className="text-white/40 text-xs">{label}</span>
    </div>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
      <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.47 11.47 0 003.59.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.01l-2.2 2.21z" />
    </svg>
  );
}

function MicIcon({ muted }: { muted: boolean }) {
  return muted ? (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="1" y1="1" x2="23" y2="23" /><path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6" />
      <path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23M12 19v4M8 23h8" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
    </svg>
  );
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return muted ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" />
    </svg>
  );
}

function FlipIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /><path d="M7 3l-3 3 3 3M4 6h5" />
    </svg>
  );
}