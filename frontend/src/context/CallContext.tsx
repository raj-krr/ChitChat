import {
  createContext, useContext, useEffect, useRef, useState,
} from "react";
import { socket } from "../apis/socket";
import { soundSynth } from "../utils/audioSynth";
import { useNotifications } from "../hooks/useNotifications";

export type CallStatus = "idle" | "calling" | "ringing" | "connected";

/**
 * Returns iceServers configuration (STUN + TURN) for WebRTC PeerConnection
 */
export function getIceServers(): RTCConfiguration {
  const turnUrl = import.meta.env.VITE_TURN_SERVER_URL;
  const turnUser = import.meta.env.VITE_TURN_USERNAME;
  const turnPass = import.meta.env.VITE_TURN_CREDENTIAL;

  const iceServers: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ];

  if (turnUrl) {
    iceServers.push({
      urls: turnUrl,
      username: turnUser || undefined,
      credential: turnPass || undefined,
    });
  }

  return { iceServers, iceCandidatePoolSize: 10 };
}

const CallContext = createContext<any>(null);

/* ─── provider ──────────────────────────────────────────────────────────── */
export const CallProvider = ({ children }: any) => {
  const [incomingCall,    setIncomingCall]    = useState<any>(null);
  const [callStatus,      setCallStatus]      = useState<CallStatus>("idle");
  const [callUser,        setCallUser]        = useState<any>(null);
  const [callType,        setCallType]        = useState<"audio" | "video">("audio");
  const [activeCallUserId,setActiveCallUserId]= useState<string | null>(null);
  const [missedCallMsg,   setMissedCallMsg]   = useState<string | null>(null);

  const { notify } = useNotifications();

  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef  = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const callStatusRef  = useRef<CallStatus>("idle");
  const timeoutRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

  // keep ref in sync
  useEffect(() => { callStatusRef.current = callStatus; }, [callStatus]);

  /* ── audio control ───────────────────────────────────────────────────── */
  const stopAllAudio = () => {
    soundSynth.stop();
  };

  const playRingtone = () => {
    stopAllAudio();
    soundSynth.playRingtone();
  };

  const playDialtone = () => {
    stopAllAudio();
    soundSynth.playDialtone();
  };

  /* ── 30s auto-cutoff ─────────────────────────────────────────────────── */
  const startMissedTimer = (toUserId: string, callerName: string) => {
    clearMissedTimer();
    timeoutRef.current = setTimeout(() => {
      if (callStatusRef.current === "calling") {
        socket.emit("call-missed", { to: toUserId });
        stopAllAudio();
        setCallStatus("idle");
        setCallUser(null);
        setActiveCallUserId(null);
        setMissedCallMsg(`${callerName} is not responding right now`);
        setTimeout(() => setMissedCallMsg(null), 4000);
      }
    }, 30_000);
  };

  const clearMissedTimer = () => {
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
  };

  useEffect(() => {
    const onIncoming = ({ from, offer, user, type }: any) => {
      if (callStatusRef.current === "connected") return; // already in a call
      setIncomingCall({ from, offer, type });
      setCallUser(user);
      setCallStatus("ringing");
      setCallType(type);
      playRingtone();

      // Trigger desktop notification if tab is inactive
      notify({
        title: `Incoming ${type === "video" ? "📹 Video" : "📞 Audio"} Call`,
        body: `${user?.username || "Someone"} is calling you on ChitChat...`,
        tag: "chitchat-call",
      });
    };

    const onRejected = () => {
      clearMissedTimer();
      stopAllAudio();
      setCallStatus("idle");
      setIncomingCall(null);
      setCallUser(null);
      setActiveCallUserId(null);
      setMissedCallMsg("User declined the call");
      setTimeout(() => setMissedCallMsg(null), 3000);
    };

    const onBusy = () => {
      clearMissedTimer();
      stopAllAudio();
      setCallStatus("idle");
      setCallUser(null);
      setActiveCallUserId(null);
      setMissedCallMsg("User is busy right now");
      setTimeout(() => setMissedCallMsg(null), 4000);
    };

    const onMissed = () => {
      stopAllAudio();
      setIncomingCall(null);
      setCallStatus("idle");
    };

    socket.on("incoming-call",  onIncoming);
    socket.on("call-rejected",  onRejected);
    socket.on("call-missed",    onMissed);
    socket.on("call-busy",      onBusy);   

    return () => {
      socket.off("incoming-call",  onIncoming);
      socket.off("call-rejected",  onRejected);
      socket.off("call-missed",    onMissed);
      socket.off("call-busy",      onBusy);
    };
  }, [notify]);

  useEffect(() => {
    if (callStatus === "calling") {
      playDialtone();
    } else if (callStatus === "connected" || callStatus === "idle") {
      stopAllAudio();
      clearMissedTimer();
    }
  }, [callStatus]);

  return (
    <CallContext.Provider value={{
      incomingCall,    setIncomingCall,
      callStatus,      setCallStatus,
      callUser,        setCallUser,
      activeCallUserId,setActiveCallUserId,
      callType,        setCallType,
      remoteVideoRef,  localVideoRef, remoteAudioRef,
      missedCallMsg,
      startMissedTimer,
      clearMissedTimer,
      stopAllAudio,
    }}>
      {children}
    </CallContext.Provider>
  );
};

export const useGlobalCall = () => useContext(CallContext);