import { createContext, useContext, useEffect, useState } from "react";
import { socket } from "../apis/socket";

const CallContext = createContext<any>(null);

export const CallProvider = ({ children }: any) => {
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [callStatus, setCallStatus] = useState<
    "idle" | "calling" | "ringing" | "connected"
  >("idle");

  const [callUser, setCallUser] = useState<any>(null);
  const [callType, setCallType] = useState<"audio" | "video">("audio");
const [activeCallUserId, setActiveCallUserId] = useState<string | null>(null);
  useEffect(() => {
    const onIncoming = ({ from, offer, user, type }: any) => {
      setIncomingCall({ from, offer, type });
      setCallUser(user); //  store caller info
      setCallStatus("ringing");
      setCallType(type);
      
    };

    const onAnswered = () => {
      setCallStatus("connected");
    };

    const onRejected = () => {
      setCallStatus("idle");
      setIncomingCall(null);
      setCallUser(null);
    };

    const onEnded = () => {
      setCallStatus("idle");
      setIncomingCall(null);
      setCallUser(null);
    };

    socket.on("incoming-call", onIncoming);
    socket.on("call-answered", onAnswered);
    socket.on("call-rejected", onRejected);
    socket.on("call-ended", onEnded);

    return () => {
      socket.off("incoming-call", onIncoming);
      socket.off("call-answered", onAnswered);
      socket.off("call-rejected", onRejected);
      socket.off("call-ended", onEnded);
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
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useGlobalCall = () => useContext(CallContext);