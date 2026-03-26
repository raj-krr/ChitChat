import { useEffect, useState } from "react";
import { socket } from "../../apis/socket";
import { useGlobalCall } from "../../context/CallContext";
import { useCall } from "./hooks/useCall";
import { PhoneOff, PhoneMissed } from "lucide-react";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');

  .cw-root * { box-sizing: border-box; font-family: 'DM Sans', sans-serif; }

  @keyframes cw-ping {
    0%   { transform: scale(1);   opacity: .35; }
    70%  { transform: scale(1.55); opacity: 0;  }
    100% { transform: scale(1.55); opacity: 0;  }
  }
  @keyframes cw-fade-up {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes cw-pulse-dot {
    0%,100% { opacity: 1; } 50% { opacity: .35; }
  }
  @keyframes cw-toast-in {
    from { opacity: 0; transform: translate(-50%, -18px) scale(.94); }
    to   { opacity: 1; transform: translate(-50%, 0)     scale(1);   }
  }

  .cw-ping-1 { animation: cw-ping 2s cubic-bezier(.4,0,.6,1) infinite; }
  .cw-ping-2 { animation: cw-ping 2s cubic-bezier(.4,0,.6,1) infinite .45s; }
  .cw-fade-up { animation: cw-fade-up .4s ease both; }
  .cw-pulse-dot { animation: cw-pulse-dot 1.4s ease-in-out infinite; }
  .cw-toast   { animation: cw-toast-in .3s ease both; }

  /* glass card */
  .cw-glass {
    background: rgba(255,255,255,.07);
    border: 1px solid rgba(255,255,255,.12);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
  }

  /* Control button */
  .cw-ctrl {
    display: flex; flex-direction: column; align-items: center; gap: 6px;
  }
  .cw-ctrl-btn {
    display: flex; align-items: center; justify-content: center;
    border-radius: 50%; border: 1px solid; cursor: pointer;
    transition: transform .15s ease, background .15s ease, opacity .15s;
    -webkit-tap-highlight-color: transparent;
  }
  .cw-ctrl-btn:active { transform: scale(.92); }
  .cw-ctrl-btn.idle {
    background: rgba(255,255,255,.1);
    border-color: rgba(255,255,255,.12);
    color: #fff;
  }
  .cw-ctrl-btn.idle:hover { background: rgba(255,255,255,.18); }
  .cw-ctrl-btn.active-state {
    background: rgba(239,68,68,.18);
    border-color: rgba(239,68,68,.4);
    color: #f87171;
  }

  /* End call */
  .cw-end-btn {
    display: flex; align-items: center; justify-content: center;
    border-radius: 50%; background: #ef4444; cursor: pointer; border: none;
    box-shadow: 0 8px 32px rgba(239,68,68,.45);
    transition: transform .15s ease, background .15s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .cw-end-btn:hover  { background: #f87171; }
  .cw-end-btn:active { transform: scale(.92); }

  /* Accept / Reject */
  .cw-action-btn {
    display: flex; align-items: center; justify-content: center;
    border-radius: 50%; cursor: pointer; border: none;
    transition: transform .15s ease, filter .15s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .cw-action-btn:active { transform: scale(.9); }
  .cw-action-btn.accept { background: #22c55e; box-shadow: 0 8px 32px rgba(34,197,94,.4); }
  .cw-action-btn.reject { background: #ef4444; box-shadow: 0 8px 32px rgba(239,68,68,.4); }
  .cw-action-btn:hover  { filter: brightness(1.15); }

  /* Responsive sizes */
  /* Mobile-first */
  .cw-avatar-ring  { width:96px; height:96px; border-radius:50%; }
  .cw-avatar-img   { width:96px; height:96px; }

  .cw-ctrl-btn     { width:52px; height:52px; }
  .cw-ctrl-label   { font-size:11px; color:rgba(255,255,255,.45); }

  .cw-end-btn      { width:64px; height:64px; }
  .cw-action-btn   { width:62px; height:62px; }

  .cw-name         { font-size:1.4rem; font-weight:600; }
  .cw-status       { font-size:.82rem; }
  .cw-incoming-type{ font-size:.72rem; letter-spacing:.12em; }
  .cw-incoming-name{ font-size:1.9rem; }

  /* Tablet ≥ 640 */
  @media (min-width:640px) {
    .cw-avatar-ring { width:112px; height:112px; }
    .cw-avatar-img  { width:112px; height:112px; }
    .cw-ctrl-btn    { width:56px;  height:56px;  }
    .cw-end-btn     { width:70px;  height:70px;  }
    .cw-action-btn  { width:68px;  height:68px;  }
    .cw-name        { font-size:1.7rem; }
    .cw-ctrl-label  { font-size:12px; }
    .cw-incoming-name{ font-size:2.3rem; }
  }

  /* Desktop ≥ 1024 */
  @media (min-width:1024px) {
    .cw-full-overlay { align-items: center; justify-content: center; }

    /* On desktop, call UI is a centred card, not full-bleed */
    .cw-call-card {
      position: fixed;
      bottom: 32px; right: 32px;
      width: 340px;
      border-radius: 28px;
      overflow: hidden;
      inset: unset !important;
    }

    .cw-incoming-card {
      position: fixed;
      bottom: 32px; right: 32px;
      width: 340px;
      border-radius: 28px;
      overflow: hidden;
      inset: unset !important;
    }

    /* Video still full-screen on desktop */
    .cw-call-card.is-video {
      inset: 0 !important;
      width: 100% !important;
      border-radius: 0 !important;
    }
    .cw-incoming-card.is-video {
      inset: 0 !important;
      width: 100% !important;
      border-radius: 0 !important;
    }

    .cw-avatar-img  { width:80px; height:80px; }
    .cw-avatar-ring { width:80px; height:80px; }
    .cw-name        { font-size:1.25rem; }
    .cw-incoming-name{ font-size:1.5rem; margin-bottom: 28px; }
    .cw-ctrl-btn    { width:46px; height:46px; }
    .cw-end-btn     { width:56px; height:56px; }
    .cw-action-btn  { width:56px; height:56px; }
  }
`;

export default function CallWindow() {
  const callSocket = useGlobalCall();
  const { remoteVideoRef, localVideoRef, remoteAudioRef } = useGlobalCall();
  const call = useCall(remoteVideoRef, localVideoRef, remoteAudioRef);

  const [seconds,        setSeconds]        = useState(0);
  const [isMuted,        setIsMuted]        = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);

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
      {/* Inject styles once */}
      <style>{STYLES}</style>

      <div className="cw-root">
        <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: "none" }} />

        <video
          ref={remoteVideoRef} autoPlay playsInline
          style={isActive && isVideo
            ? { position: "fixed", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 50 }
            : { display: "none" }}
        />

        {/* Local PiP — repositioned per screen size via inline style fallback */}
        <video
          ref={localVideoRef} autoPlay muted playsInline
          style={isActive && isVideo ? {
            position: "fixed",
            bottom: "calc(env(safe-area-inset-bottom,0px) + 110px)",
            right: 16,
            width: "clamp(90px, 18vw, 140px)",
            height: "clamp(130px, 26vw, 200px)",
            objectFit: "cover",
            borderRadius: 14,
            border: "2px solid rgba(255,255,255,0.2)",
            zIndex: 52,
            boxShadow: "0 4px 32px rgba(0,0,0,0.6)",
          } : { display: "none" }}
        />

        {/* ── MISSED CALL TOAST ── */}
        {callSocket.missedCallMsg && (
          <div
            className="cw-toast cw-glass"
            style={{
              position: "fixed", top: 20, left: "50%",
              transform: "translateX(-50%)",
              zIndex: 200,
              display: "flex", alignItems: "center", gap: 10,
              padding: "12px 20px",
              borderRadius: 16,
              whiteSpace: "nowrap",
            }}
          >
            <PhoneMissed size={16} style={{ color: "#f87171", flexShrink: 0 }} />
            <span style={{ color: "#fff", fontSize: 13, fontWeight: 500 }}>
              {callSocket.missedCallMsg}
            </span>
          </div>
        )}

        {/* ── INCOMING CALL ── */}
        {callSocket.incomingCall && (
          <IncomingCallOverlay
            remoteName={remoteName}
            remoteAvatar={remoteAvatar}
            callType={callSocket.callType}
            isVideo={isVideo}
            onAccept={handleAccept}
            onReject={handleReject}
          />
        )}

        {/* ── ACTIVE CALL UI ── */}
        {isActive && (
          <ActiveCallUI
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
          />
        )}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────
   Active Call UI
───────────────────────────────────────── */
function ActiveCallUI({
  isVideo, isConnected, remoteName, remoteAvatar,
  seconds, fmt, isMuted, isSpeakerMuted,
  onMute, onSpeaker, onEnd, onFlip,
}: any) {
  const bg = isVideo
    ? "transparent"
    : "linear-gradient(160deg,#0d1117 0%,#161b2e 40%,#0f2744 100%)";

  return (
    <div
      className={`cw-call-card${isVideo ? " is-video" : ""}`}
      style={{
        position: "fixed", inset: 0,
        background: bg,
        color: "#fff",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Decorative background orbs — hidden on video */}
      {!isVideo && (
        <>
          <div style={{
            position: "absolute", top: "-80px", left: "-60px",
            width: 300, height: 300, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,.18) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", bottom: "20%", right: "-40px",
            width: 220, height: 220, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(34,197,94,.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
        </>
      )}

      {/* Top section */}
      <div className="cw-fade-up" style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        paddingTop: "clamp(40px, 10vh, 72px)",
        paddingBottom: 16,
        position: "relative", zIndex: 1,
      }}>
        {!isVideo && (
          <div style={{ position: "relative", marginBottom: 20 }}>
            {/* Glow ring when connected */}
            {isConnected && (
              <div style={{
                position: "absolute", inset: -8,
                borderRadius: "50%",
                background: "rgba(34,197,94,.2)",
                border: "1px solid rgba(34,197,94,.35)",
              }} />
            )}
            <img
              src={remoteAvatar}
              className="cw-avatar-img"
              style={{ borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(255,255,255,.15)", display: "block" }}
            />
            {isConnected && (
              <span style={{
                position: "absolute", bottom: 4, right: 4,
                width: 14, height: 14, borderRadius: "50%",
                background: "#22c55e", border: "2px solid #0d1117",
              }} />
            )}
          </div>
        )}

        <h2 className="cw-name" style={{ margin: 0, letterSpacing: "-.02em" }}>{remoteName}</h2>

        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
          {isConnected ? (
            <>
              <span className="cw-pulse-dot" style={{
                width: 7, height: 7, borderRadius: "50%", background: "#4ade80", display: "inline-block",
              }} />
              <span className="cw-status" style={{ color: "#4ade80", fontWeight: 500 }}>{fmt(seconds)}</span>
            </>
          ) : (
            <span className="cw-status" style={{ color: "rgba(255,255,255,.4)", animation: "cw-pulse-dot 1.4s ease-in-out infinite" }}>
              Calling {remoteName}…
            </span>
          )}
        </div>

        {/* Active pills */}
        {(isMuted || isSpeakerMuted) && (
          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap", justifyContent: "center" }}>
            {isMuted      && <Pill color="red">🔇 Muted</Pill>}
            {isSpeakerMuted && <Pill color="yellow">🔈 Speaker off</Pill>}
          </div>
        )}
      </div>

      <div style={{ flex: 1 }} />

      {/* Control bar */}
      <div
        className="cw-glass cw-fade-up"
        style={{
          margin: "0 clamp(12px,4vw,24px)",
          marginBottom: "calc(env(safe-area-inset-bottom,16px) + clamp(20px,4vh,36px))",
          borderRadius: 24,
          padding: "clamp(16px,4vw,24px) clamp(20px,5vw,32px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "clamp(14px,4vw,28px)",
          position: "relative", zIndex: 1,
          animationDelay: ".1s",
        }}
      >
        <ControlBtn
          label={isMuted ? "Unmute" : "Mute"}
          active={isMuted}
          onClick={onMute}
          icon={<MicIcon muted={isMuted} />}
        />
        <ControlBtn
          label={isSpeakerMuted ? "Unmute" : "Speaker"}
          active={isSpeakerMuted}
          onClick={onSpeaker}
          icon={<SpeakerIcon muted={isSpeakerMuted} />}
        />

        {/* End call — centre */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <button className="cw-end-btn" onClick={onEnd} aria-label="End call">
            <PhoneOff size={24} color="#fff" />
          </button>
          <span className="cw-ctrl-label" style={{ color: "rgba(255,255,255,.45)", fontSize: 11 }}>End</span>
        </div>

        {isVideo
          ? <ControlBtn label="Flip" active={false} onClick={onFlip} icon={<FlipIcon />} />
          : <div style={{ width: 52, height: 52 }} />}

        {/* Spacer to keep end centred */}
        <div style={{ width: 52, height: 52, visibility: "hidden" }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Incoming Call Overlay
───────────────────────────────────────── */
function IncomingCallOverlay({ remoteName, remoteAvatar, callType, isVideo, onAccept, onReject }: any) {
  return (
    <div
      className={`cw-incoming-card${isVideo ? " is-video" : ""} cw-fade-up`}
      style={{
        position: "fixed", inset: 0,
        background: "linear-gradient(160deg,#0d1117 0%,#161b2e 45%,#0f2744 100%)",
        zIndex: 60,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        color: "#fff",
        paddingBottom: "env(safe-area-inset-bottom,0px)",
      }}
    >
      {/* Background orbs */}
      <div style={{
        position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)",
        width: "min(400px, 80vw)", height: "min(400px, 80vw)",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,.12) 0%, transparent 65%)",
        pointerEvents: "none",
      }} />

      {/* Avatar with ping rings */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28 }}>
        <span className="cw-ping-1" style={{
          position: "absolute",
          width: "clamp(130px,22vw,160px)", height: "clamp(130px,22vw,160px)",
          borderRadius: "50%", background: "rgba(255,255,255,.06)",
        }} />
        <span className="cw-ping-2" style={{
          position: "absolute",
          width: "clamp(105px,18vw,130px)", height: "clamp(105px,18vw,130px)",
          borderRadius: "50%", background: "rgba(255,255,255,.09)",
        }} />
        <img
          src={remoteAvatar}
          className="cw-avatar-img"
          style={{ borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(255,255,255,.18)", position: "relative", zIndex: 2 }}
        />
      </div>

      <p
        className="cw-incoming-type"
        style={{ color: "rgba(255,255,255,.45)", textTransform: "uppercase", fontWeight: 500, marginBottom: 6 }}
      >
        Incoming {callType} call
      </p>
      <h2
        className="cw-incoming-name"
        style={{ fontWeight: 700, letterSpacing: "-.03em", margin: "0 0 clamp(28px,6vh,44px)" }}
      >
        {remoteName}
      </h2>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "clamp(40px,12vw,72px)" }}>
        <CallActionBtn color="red" label="Decline" onClick={onReject}>
          <PhoneOff size={24} color="#fff" />
        </CallActionBtn>
        <CallActionBtn color="green" label="Accept" onClick={onAccept}>
          <PhoneIcon />
        </CallActionBtn>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Sub-components (unchanged logic, new classes)
───────────────────────────────────────── */
function CallActionBtn({ color, label, onClick, children }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <button
        className={`cw-action-btn ${color === "red" ? "reject" : "accept"}`}
        onClick={onClick}
        aria-label={label}
      >
        {children}
      </button>
      <span style={{ color: "rgba(255,255,255,.45)", fontSize: 12 }}>{label}</span>
    </div>
  );
}

function Pill({ color, children }: any) {
  const style: React.CSSProperties = color === "red"
    ? { background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.35)", color: "#f87171" }
    : { background: "rgba(234,179,8,.15)",  border: "1px solid rgba(234,179,8,.35)",  color: "#fbbf24" };
  return (
    <span style={{ ...style, padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 500 }}>
      {children}
    </span>
  );
}

function ControlBtn({ icon, label, active, onClick }: any) {
  return (
    <div className="cw-ctrl">
      <button
        className={`cw-ctrl-btn ${active ? "active-state" : "idle"}`}
        onClick={onClick}
        aria-label={label}
      >
        {icon}
      </button>
      <span className="cw-ctrl-label">{label}</span>
    </div>
  );
}

/* ── Icon components (unchanged) ── */
function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="white" style={{ width: 26, height: 26 }}>
      <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.47 11.47 0 003.59.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.01l-2.2 2.21z" />
    </svg>
  );
}

function MicIcon({ muted }: { muted: boolean }) {
  return muted ? (
    <svg viewBox="0 0 24 24" style={{ width: 22, height: 22 }} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6" />
      <path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23M12 19v4M8 23h8" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" style={{ width: 22, height: 22 }} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
    </svg>
  );
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return muted ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" />
    </svg>
  );
}

function FlipIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
      <path d="M23 7l-7 5 7 5V7z" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      <path d="M7 3l-3 3 3 3M4 6h5" />
    </svg>
  );
}