import { createContext, useContext, useEffect, useRef, useState } from "react";
import { socket } from "../apis/socket";

const CallContext = createContext<any>(null);

export const CallProvider = ({ children }: any) => {
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [callStatus, setCallStatus] = useState<
    "idle" | "calling" | "ringing" | "connected"
  >("idle");

  const [callUser, setCallUser] = useState<any>(null);
  const [callType, setCallType] = useState<"audio" | "video">("audio");
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const [activeCallUserId, setActiveCallUserId] = useState<string | null>(null);

  const callStatusRef = useRef(callStatus);
  useEffect(() => {
    callStatusRef.current = callStatus;
  }, [callStatus]);

  useEffect(() => {
    const onIncoming = ({ from, offer, user, type }: any) => {
      // ✅ Ignore if already in a call
      if (callStatusRef.current === "connected") return;

      setIncomingCall({ from, offer, type });
      setCallUser(user);
      setCallStatus("ringing");
      setCallType(type);
    };

    const onRejected = () => {
      setCallStatus("idle");
      setIncomingCall(null);
      setCallUser(null);
      setActiveCallUserId(null);
    };

    // ✅ call-ended is intentionally NOT handled here anymore.
    // useCall handles it directly so cleanup() is always called
    // before state resets. Handling it in both places caused a race
    // where state reset before the peer was closed.

    socket.on("incoming-call", onIncoming);
    socket.on("call-rejected", onRejected);

    return () => {
      socket.off("incoming-call", onIncoming);
      socket.off("call-rejected", onRejected);
    };
  }, []);

  return (
    <CallContext.Provider
      value={{
        incomingCall,
        setIncomingCall,
        callStatus,
        setCallStatus,
        callUser,
        setCallUser,
        activeCallUserId,
        setActiveCallUserId,
        callType,
        setCallType,
        remoteVideoRef,
        localVideoRef,
        remoteAudioRef,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useGlobalCall = () => useContext(CallContext);