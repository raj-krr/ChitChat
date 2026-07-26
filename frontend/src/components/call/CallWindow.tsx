import { useEffect, useState } from "react";
import { socket } from "../../apis/socket";
import { useGlobalCall } from "../../context/CallContext";
import { useCall } from "./hooks/useCall";
import { PhoneOff, PhoneMissed, ShieldCheck, Video, Mic, MicOff, Volume2, VolumeX, RefreshCw } from "lucide-react";

/* ─────────────────────────────────────────
   Global Production Call Window Styles
───────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

  .cw * { box-sizing: border-box; font-family: 'Outfit', sans-serif; }

  /* ── Keyframes ── */
  @keyframes cw-ping {
    0%   { transform: scale(1);    opacity: .5; }
    70%  { transform: scale(1.65); opacity: 0;  }
    100% { transform: scale(1.65); opacity: 0;  }
  }
  @keyframes cw-fade-up {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes cw-scale-in {
    from { opacity: 0; transform: scale(.95); }
    to   { opacity: 1; transform: scale(1);   }
  }
  @keyframes cw-pulse-dot {
    0%,100% { opacity: 1; transform: scale(1); }
    50%     { opacity: .4; transform: scale(0.85); }
  }
  @keyframes cw-wave {
    0%, 100% { height: 6px; }
    50%      { height: 22px; }
  }
  @keyframes cw-toast {
    from { opacity: 0; transform: translate(-50%,-16px) scale(.95); }
    to   { opacity: 1; transform: translate(-50%,0)     scale(1);   }
  }
  @keyframes cw-backdrop-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .cw-anim-fade-up  { animation: cw-fade-up  .4s cubic-bezier(.16,1,.3,1) both; }
  .cw-anim-scale-in { animation: cw-scale-in .4s cubic-bezier(.16,1,.3,1) both; }
  .cw-anim-toast    { animation: cw-toast    .35s cubic-bezier(.16,1,.3,1) both; }
  .cw-ping-a { animation: cw-ping 2.4s ease-in-out infinite; }
  .cw-ping-b { animation: cw-ping 2.4s ease-in-out infinite .6s; }
  .cw-pulse  { animation: cw-pulse-dot 1.6s ease-in-out infinite; }

  /* ── Wave animation bars for active audio call ── */
  .cw-wave-bar {
    width: 3.5px;
    background: #4ade80;
    border-radius: 4px;
    animation: cw-wave 1.2s ease-in-out infinite;
  }
  .cw-wave-bar:nth-child(1) { animation-delay: 0.0s; }
  .cw-wave-bar:nth-child(2) { animation-delay: 0.2s; }
  .cw-wave-bar:nth-child(3) { animation-delay: 0.4s; }
  .cw-wave-bar:nth-child(4) { animation-delay: 0.1s; }

  /* ── Backdrop — desktop ── */
  .cw-backdrop {
    position: fixed; inset: 0; z-index: 998;
    background: rgba(4, 7, 13, 0.75);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    animation: cw-backdrop-in .35s ease both;
    display: none;
  }
  @media (min-width: 768px) {
    .cw-backdrop { display: block; }
  }

  /* ── Call window container — mobile: full screen ── */
  .cw-window {
    position: fixed; inset: 0; z-index: 999;
    display: flex; flex-direction: column;
    color: #fff;
    background: radial-gradient(circle at 50% 20%, #172033 0%, #0a0d14 70%, #05070a 100%);
    overflow: hidden;
  }

  /* ── Call window container — desktop: centered luxury card ── */
  @media (min-width: 768px) {
    .cw-window {
      inset: unset !important;
      position: fixed !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      width: min(82vw, 940px);
      height: min(82vh, 660px);
      border-radius: 24px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow:
        0 0 0 1px rgba(255, 255, 255, 0.05),
        0 30px 90px rgba(0, 0, 0, 0.85),
        0 10px 30px rgba(0, 0, 0, 0.6);
    }
    .cw-window.is-video {
      width:  min(88vw, 1080px);
      height: min(88vh, 720px);
    }
  }

  /* ── Incoming window container — mobile ── */
  .cw-incoming-window {
    position: fixed; inset: 0; z-index: 1000;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    color: #fff;
    background: radial-gradient(circle at 50% 30%, #1e1b4b 0%, #0f172a 65%, #05070a 100%);
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }

  /* ── Incoming window container — desktop ── */
  @media (min-width: 768px) {
    .cw-incoming-window {
      inset: unset !important;
      position: fixed !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      width: min(80vw, 420px);
      height: min(80vh, 540px);
      border-radius: 24px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow:
        0 30px 90px rgba(0,0,0,.85),
        0 10px 30px rgba(0,0,0,.5);
      padding-bottom: 0;
    }
  }

  /* ── Glass Dock Container ── */
  .cw-dock {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.14);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  }

  /* ── Control Button Item ── */
  .cw-ctrl-btn {
    display: flex; align-items: center; justify-content: center;
    width: 52px; height: 52px; border-radius: 50%;
    border: 1px solid; cursor: pointer;
    transition: all .2s cubic-bezier(.16,1,.3,1);
    -webkit-tap-highlight-color: transparent;
  }
  .cw-ctrl-btn:hover { transform: scale(1.06); }
  .cw-ctrl-btn:active { transform: scale(.92); }

  .cw-ctrl-btn.off {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.16);
    color: #fff;
  }
  .cw-ctrl-btn.off:hover { background: rgba(255, 255, 255, 0.18); }

  .cw-ctrl-btn.on-muted {
    background: rgba(239, 68, 68, 0.22);
    border-color: rgba(239, 68, 68, 0.45);
    color: #f87171;
  }
  .cw-ctrl-btn.on-muted:hover { background: rgba(239, 68, 68, 0.32); }

  .cw-ctrl-btn.on-warning {
    background: rgba(245, 158, 11, 0.22);
    border-color: rgba(245, 158, 11, 0.45);
    color: #fbbf24;
  }

  .cw-ctrl-label {
    font-size: 11px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.6);
    margin-top: 4px;
  }

  /* ── End Call Button ── */
  .cw-end-btn {
    display: flex; align-items: center; justify-content: center;
    width: 64px; height: 64px; border-radius: 50%;
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    border: 1px solid rgba(255, 255, 255, 0.2); cursor: pointer;
    box-shadow: 0 8px 30px rgba(239, 68, 68, 0.55);
    transition: all .2s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .cw-end-btn:hover  { transform: scale(1.08); background: linear-gradient(135deg, #f87171 0%, #ef4444 100%); }
  .cw-end-btn:active { transform: scale(.92); }

  /* ── Action Buttons (Accept / Reject) ── */
  .cw-action-btn {
    display: flex; align-items: center; justify-content: center;
    width: 66px; height: 66px; border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.2); cursor: pointer;
    transition: all .2s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .cw-action-btn:hover  { transform: scale(1.08); }
  .cw-action-btn:active { transform: scale(.9); }

  .cw-action-btn.accept {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    box-shadow: 0 8px 30px rgba(16, 185, 129, 0.5);
  }
  .cw-action-btn.reject {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    box-shadow: 0 8px 30px rgba(239, 68, 68, 0.5);
  }

  /* ── Avatar Styling ── */
  .cw-avatar {
    width: 96px; height: 96px;
    border-radius: 50%; object-fit: cover;
    border: 3px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    display: block; position: relative; z-index: 2;
  }
  @media (min-width: 768px) {
    .cw-avatar { width: 104px; height: 104px; }
  }
`;

/* ─────────────────────────────────────────
   Main Export Component
───────────────────────────────────────── */
export default function CallWindow() {
  const callSocket = useGlobalCall();
  const { remoteVideoRef, localVideoRef, remoteAudioRef } = useGlobalCall();
  const call = useCall(remoteVideoRef, localVideoRef, remoteAudioRef);

  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);

  const isVideo = callSocket.callType === "video";
  const isActive = callSocket.callStatus === "calling" || callSocket.callStatus === "connected";
  const isConnected = callSocket.callStatus === "connected";

  const remoteUser = callSocket.callUser;
  const remoteName = remoteUser?.username || remoteUser?.name || "User";
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

  const handleMute = () => setIsMuted(call.toggleMute());
  const handleSpeaker = () => setIsSpeakerMuted(call.toggleSpeaker());
  const handleEnd = () => { callSocket.clearMissedTimer(); call.endCall(); };

  const handleAccept = async () => {
    callSocket.stopAllAudio();
    await call.acceptCall(
      callSocket.incomingCall.from,
      callSocket.incomingCall.offer,
      callSocket.incomingCall.type,
    );
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = false;
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
      <style>{STYLES}</style>
      <div className="cw">
        <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: "none" }} />

        {/* ── MISSED CALL TOAST ── */}
        {callSocket.missedCallMsg && (
          <div
            className="cw-anim-toast cw-dock"
            style={{
              position: "fixed", top: 24, left: "50%",
              transform: "translateX(-50%)",
              zIndex: 1100,
              display: "flex", alignItems: "center", gap: 10,
              padding: "12px 22px", borderRadius: 16,
              whiteSpace: "nowrap",
            }}
          >
            <PhoneMissed size={18} style={{ color: "#f87171", flexShrink: 0 }} />
            <span style={{ color: "#fff", fontSize: 14, fontWeight: 500 }}>
              {callSocket.missedCallMsg}
            </span>
          </div>
        )}

        {/* ── INCOMING CALL OVERLAY ── */}
        {callSocket.incomingCall && (
          <>
            <div className="cw-backdrop" />
            <IncomingCallOverlay
              remoteName={remoteName}
              remoteAvatar={remoteAvatar}
              callType={callSocket.callType}
              onAccept={handleAccept}
              onReject={handleReject}
            />
          </>
        )}

        {/* ── ACTIVE CALL WINDOW ── */}
        {isActive && (
          <>
            <div className="cw-backdrop" />
            <ActiveCallWindow
              isVideo={isVideo}
              isConnected={isConnected}
              remoteName={remoteName}
              remoteAvatar={remoteAvatar}
              seconds={seconds}
              fmt={fmt}
              isMuted={isMuted}
              isSpeakerMuted={isSpeakerMuted}
              onMute={handleMute}
              onSpeaker={handleSpeaker}
              onEnd={handleEnd}
              onFlip={() => call.switchCamera()}
              remoteVideoRef={remoteVideoRef}
              localVideoRef={localVideoRef}
            />
          </>
        )}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────
   Active Call Window
───────────────────────────────────────── */
function ActiveCallWindow({
  isVideo, isConnected, remoteName, remoteAvatar,
  seconds, fmt, isMuted, isSpeakerMuted,
  onMute, onSpeaker, onEnd, onFlip,
  remoteVideoRef, localVideoRef,
}: any) {
  return (
    <div
      className={`cw-window cw-anim-scale-in${isVideo ? " is-video" : ""}`}
      style={{ position: "fixed" }}
    >
      {/* Top Header Bar */}
      <HeaderOverlay remoteName={remoteName} remoteAvatar={remoteAvatar} isConnected={isConnected} isVideo={isVideo} fmt={fmt} seconds={seconds} />

      {/* Remote Video Stream — Full Fill (Only visible when connected) */}
      <video
        ref={remoteVideoRef} autoPlay playsInline
        style={isVideo && isConnected ? {
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover", zIndex: 0,
          background: "#080c14",
        } : { display: "none" }}
      />

      {/* Local Self-Video Picture-in-Picture (PiP) */}
      <div
        style={isVideo ? {
          position: "absolute",
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 110px)",
          right: 18,
          width: "clamp(110px, 18vw, 170px)",
          height: "clamp(150px, 24vw, 230px)",
          borderRadius: 20,
          overflow: "hidden",
          border: "2px solid rgba(255, 255, 255, 0.25)",
          zIndex: 20,
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.75)",
          background: "#0d1322",
        } : { display: "none" }}
      >
        <span style={{
          position: "absolute", top: 8, left: 8, zIndex: 21,
          padding: "3px 8px", borderRadius: 8,
          background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.15)",
          fontSize: 10, fontWeight: 600, color: "#fff", letterSpacing: "0.05em",
        }}>
          YOU
        </span>
        <video
          ref={localVideoRef} autoPlay muted playsInline
          style={{
            width: "100%", height: "100%",
            objectFit: "cover", transform: "scaleX(-1)",
          }}
        />
      </div>

      {/* Center Audio / Ambient Ringing Area */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        zIndex: 1,
        overflow: "hidden",
        paddingTop: isVideo && isConnected ? 0 : "clamp(20px, 4vh, 40px)",
      }}>
        {/* Ringing / Audio Call UI Layout (Shown for voice calls OR video calls until answered) */}
        {(!isVideo || !isConnected) && (
          <>
            <div style={{
              position: "absolute", top: "-15%", left: "50%",
              transform: "translateX(-50%)",
              width: "clamp(300px, 60%, 520px)", height: "clamp(300px, 60%, 520px)",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(99, 102, 241, 0.22) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />
            <div style={{
              position: "absolute", bottom: "10%", right: "-5%",
              width: "clamp(200px, 35%, 360px)", height: "clamp(200px, 35%, 360px)",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(16, 185, 129, 0.16) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />
          </>
        )}

        {/* Audio / Video Ringing Call UI Layout */}
        {(!isVideo || !isConnected) && (
          <div className="cw-anim-fade-up" style={{
            display: "flex", flexDirection: "column", alignItems: "center", zIndex: 10,
          }}>
            {/* Avatar with pulse rings */}
            <div style={{ position: "relative", marginBottom: 24 }}>
              {isConnected && (
                <>
                  <div className="cw-ping-a" style={{
                    position: "absolute", inset: -14,
                    borderRadius: "50%",
                    border: "2px solid rgba(34, 197, 94, 0.35)",
                  }} />
                  <div className="cw-ping-b" style={{
                    position: "absolute", inset: -28,
                    borderRadius: "50%",
                    border: "1px solid rgba(34, 197, 94, 0.2)",
                  }} />
                </>
              )}
              <img src={remoteAvatar} className="cw-avatar" alt={remoteName} />
            </div>

            <h2 style={{
              margin: 0,
              fontSize: "clamp(1.4rem, 3vw, 1.85rem)",
              fontWeight: 700,
              letterSpacing: "-.02em",
            }}>
              {remoteName}
            </h2>

            {/* Live Audio Visualizer & Call Timer */}
            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
              {isConnected ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 3, height: 22 }}>
                    <div className="cw-wave-bar" />
                    <div className="cw-wave-bar" />
                    <div className="cw-wave-bar" />
                    <div className="cw-wave-bar" />
                  </div>
                  <span style={{ color: "#4ade80", fontSize: ".95rem", fontWeight: 600, letterSpacing: ".02em" }}>
                    {fmt(seconds)}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>• Encrypted</span>
                </>
              ) : (
                <span className="cw-pulse" style={{ color: "rgba(255,255,255,0.5)", fontSize: ".9rem", fontWeight: 500 }}>
                  Ringing {remoteName}…
                </span>
              )}
            </div>

            {/* Active Status Badges */}
            {(isMuted || isSpeakerMuted) && (
              <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap", justifyContent: "center" }}>
                {isMuted        && <StatusPill color="red"><MicOff size={13} /> Microphone Muted</StatusPill>}
                {isSpeakerMuted && <StatusPill color="yellow"><VolumeX size={13} /> Speaker Muted</StatusPill>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Control Dock */}
      <ControlDock
        isVideo={isVideo}
        isMuted={isMuted}
        isSpeakerMuted={isSpeakerMuted}
        onMute={onMute}
        onSpeaker={onSpeaker}
        onEnd={onEnd}
        onFlip={onFlip}
      />
    </div>
  );
}

/* ── Top Header Overlay Bar ── */
function HeaderOverlay({ remoteName, remoteAvatar, isConnected, isVideo, fmt, seconds }: any) {
  return (
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0,
      padding: "16px 24px",
      background: "linear-gradient(180deg, rgba(5,7,10,0.85) 0%, rgba(5,7,10,0) 100%)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      zIndex: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <img src={remoteAvatar} style={{
          width: 40, height: 40, borderRadius: "50%",
          objectFit: "cover", border: "2px solid rgba(255,255,255,0.2)",
        }} alt={remoteName} />
        <div>
          <div style={{ fontWeight: 600, fontSize: "1rem", color: "#fff" }}>{remoteName}</div>
          <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
            <span className="cw-pulse" style={{
              width: 7, height: 7, borderRadius: "50%",
              background: isConnected ? "#4ade80" : "#fbbf24", display: "inline-block",
            }} />
            {isConnected ? `${isVideo ? "HD Video" : "HD Voice"} • ${fmt(seconds)}` : "Connecting..."}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 12px", borderRadius: 20, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
        <ShieldCheck size={14} color="#4ade80" />
        <span style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.8)" }}>End-to-End</span>
      </div>
    </div>
  );
}

/* ── Bottom Control Dock ── */
function ControlDock({ isVideo, isMuted, isSpeakerMuted, onMute, onSpeaker, onEnd, onFlip }: any) {
  return (
    <div style={{
      display: "flex", justifyContent: "center",
      position: "relative", zIndex: 30,
      padding: "0 20px 24px",
    }}>
      <div
        className="cw-dock"
        style={{
          borderRadius: 26,
          padding: "14px 28px",
          display: "flex",
          alignItems: "center",
          gap: "clamp(14px, 3.5vw, 32px)",
        }}
      >
        <CtrlBtn
          label={isMuted ? "Unmute" : "Mute"}
          on={isMuted}
          variant="muted"
          onClick={onMute}
          icon={isMuted ? <MicOff size={22} /> : <Mic size={22} />}
        />

        <CtrlBtn
          label={isSpeakerMuted ? "Unmute" : "Speaker"}
          on={isSpeakerMuted}
          variant="warning"
          onClick={onSpeaker}
          icon={isSpeakerMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
        />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <button className="cw-end-btn" onClick={onEnd} aria-label="End call">
            <PhoneOff size={26} color="#fff" />
          </button>
          <span className="cw-ctrl-label" style={{ color: "#f87171" }}>End</span>
        </div>

        {isVideo ? (
          <CtrlBtn
            label="Flip"
            on={false}
            onClick={onFlip}
            icon={<RefreshCw size={22} />}
          />
        ) : (
          <div style={{ width: 52, height: 52, visibility: "hidden" }} />
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Incoming Call Overlay
───────────────────────────────────────── */
function IncomingCallOverlay({ remoteName, remoteAvatar, callType, onAccept, onReject }: any) {
  return (
    <div className="cw-incoming-window cw-anim-scale-in" style={{ position: "fixed" }}>
      {/* Outer Glow Orb */}
      <div style={{
        position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)",
        width: "80%", height: "80%", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 65%)",
        pointerEvents: "none",
      }} />

      {/* Avatar with pulse rings */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 26 }}>
        <span className="cw-ping-a" style={{
          position: "absolute", width: 160, height: 160,
          borderRadius: "50%", border: "2px solid rgba(255,255,255,0.15)",
        }} />
        <span className="cw-ping-b" style={{
          position: "absolute", width: 130, height: 130,
          borderRadius: "50%", border: "1px solid rgba(255,255,255,0.25)",
        }} />
        <img src={remoteAvatar} className="cw-avatar" alt={remoteName} />
      </div>

      <p style={{
        color: "rgba(255,255,255,0.5)", fontSize: 12,
        fontWeight: 600, letterSpacing: ".15em",
        textTransform: "uppercase", margin: "0 0 8px",
        display: "flex", alignItems: "center", gap: 6,
      }}>
        {callType === "video" ? <Video size={14} color="#6366f1" /> : <Mic size={14} color="#10b981" />}
        INCOMING {callType.toUpperCase()} CALL
      </p>

      <h2 style={{
        margin: "0 0 36px",
        fontSize: "clamp(1.5rem, 4vw, 1.9rem)",
        fontWeight: 700, letterSpacing: "-.03em",
        textAlign: "center", padding: "0 20px",
      }}>
        {remoteName}
      </h2>

      {/* Accept & Reject Action Buttons */}
      <div style={{ display: "flex", gap: "clamp(36px, 12vw, 64px)" }}>
        <ActionBtn variant="reject" label="Decline" onClick={onReject}>
          <PhoneOff size={26} color="#fff" />
        </ActionBtn>
        <ActionBtn variant="accept" label="Accept" onClick={onAccept}>
          <PhoneAcceptIcon />
        </ActionBtn>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Reusable Sub-components
───────────────────────────────────────── */
function CtrlBtn({ icon, label, on, variant = "muted", onClick }: any) {
  const activeClass = on ? (variant === "muted" ? "on-muted" : "on-warning") : "off";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <button className={`cw-ctrl-btn ${activeClass}`} onClick={onClick} aria-label={label}>
        {icon}
      </button>
      <span className="cw-ctrl-label">{label}</span>
    </div>
  );
}

function ActionBtn({ variant, label, onClick, children }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <button className={`cw-action-btn ${variant}`} onClick={onClick} aria-label={label}>
        {children}
      </button>
      <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 500 }}>{label}</span>
    </div>
  );
}

function StatusPill({ color, children }: any) {
  const s = color === "red"
    ? { background: "rgba(239,68,68,0.18)", border: "1px solid rgba(239,68,68,0.35)", color: "#f87171" }
    : { background: "rgba(245,158,11,0.18)", border: "1px solid rgba(245,158,11,0.35)", color: "#fbbf24" };
  return (
    <span style={{
      ...s,
      padding: "4px 12px",
      borderRadius: 99,
      fontSize: 12,
      fontWeight: 500,
      display: "flex",
      alignItems: "center",
      gap: 6,
    }}>
      {children}
    </span>
  );
}

function PhoneAcceptIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="white" style={{ width: 28, height: 28 }}>
      <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.47 11.47 0 003.59.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.01l-2.2 2.21z" />
    </svg>
  );
}