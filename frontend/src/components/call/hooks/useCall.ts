import { useEffect, useRef } from "react";
import { socket } from "../../../apis/socket";
import { useGlobalCall } from "../../../context/CallContext";

export function useCall(remoteVideoRef: any, localVideoRef: any, remoteAudioRef: any) {
const peerRef = useRef<RTCPeerConnection | null>(null);
const localStreamRef = useRef<MediaStream | null>(null);

const { setActiveCallUserId, activeCallUserId } = useGlobalCall();
const callSocket = useGlobalCall();

//  SOCKET LISTENERS (ONLY ONCE)
useEffect(() => {
const handleAnswer = ({ answer }: any) => {
console.log("📩 answer received");
setRemoteAnswer(answer);
};

const handleIce = ({ candidate }: any) => {
  addIceCandidate(candidate);
};

socket.on("call-answered", handleAnswer);
socket.on("ice-candidate", handleIce);

return () => {
  socket.off("call-answered", handleAnswer);
  socket.off("ice-candidate", handleIce);
};

}, []);

//  CREATE PEER
const createPeer = (remoteId: string) => {
const peer = new RTCPeerConnection({
iceServers: [
{ urls: "stun:stun.l.google.com:19302" },
{
urls: "turn:openrelay.metered.ca:80",
username: "openrelayproject",
credential: "openrelayproject",
},
],
});

// ICE
peer.onicecandidate = (e) => {
  if (e.candidate) {
    socket.emit("ice-candidate", {
      to: remoteId,
      candidate: e.candidate,
    });
  }
};

// TRACK HANDLER
peer.ontrack = (event) => {
  console.log("🎥 TRACK:", event.track.kind);

  const track = event.track;

  if (track.kind === "video" && remoteVideoRef.current) {
    const videoStream = new MediaStream([track]);
    remoteVideoRef.current.srcObject = videoStream;
    remoteVideoRef.current.play().catch(() => {});
  }

  if (track.kind === "audio" && remoteAudioRef.current) {
    const audioStream = new MediaStream([track]);
    remoteAudioRef.current.srcObject = audioStream;
    remoteAudioRef.current.muted = false;
      remoteAudioRef.current.volume = 1;

  remoteAudioRef.current.play().catch(() => {
    console.log("⚠️ autoplay blocked");
  });
  }
};

return peer;

};

//  START CALL
const startCall = async (to: string, user: any, type: "audio" | "video" = "audio") => {
// ♻️ RESET
if (peerRef.current) {
console.log("♻️ resetting old peer");
cleanup();
}

try {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: type === "video",
  });

  localStreamRef.current = stream;
  setActiveCallUserId(to);

  if (localVideoRef.current) {
    localVideoRef.current.srcObject = stream;
  }

  const peer = createPeer(to);
  peerRef.current = peer;

  stream.getTracks().forEach((t) => peer.addTrack(t, stream));

  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);

  callSocket.setCallType(type);

  socket.emit("call-user", {
    to,
    offer,
    user,
    type,
  });

  callSocket.setCallStatus("calling");
  callSocket.setCallUser(user);
} catch (err) {
  console.error(" getUserMedia error", err);
}


};

//  ACCEPT CALL
  const acceptCall = async (from: string, offer: any, type = "audio") => {
  if (peerRef.current) cleanup();
const stream = await navigator.mediaDevices.getUserMedia({
audio: true,
video: type === "video",
});

localStreamRef.current = stream;
setActiveCallUserId(from);

if (localVideoRef.current) {
  localVideoRef.current.srcObject = stream;
}

const peer = createPeer(from);
peerRef.current = peer;

stream.getTracks().forEach((t) => peer.addTrack(t, stream));

await peer.setRemoteDescription(new RTCSessionDescription(offer));

const answer = await peer.createAnswer();
await peer.setLocalDescription(answer);

socket.emit("answer-call", { to: from, answer });

callSocket.setCallStatus("connected");

};

// ANSWER RECEIVED
const setRemoteAnswer = async (answer: any) => {
if (!peerRef.current) return;


await peerRef.current.setRemoteDescription(
  new RTCSessionDescription(answer)
);

callSocket.setCallStatus("connected");

};
//  ICE
const addIceCandidate = async (candidate: any) => {

  try {
  if (!peerRef.current || peerRef.current.signalingState === "closed") return;
  await peerRef.current.addIceCandidate(
    new RTCIceCandidate(candidate)
  );
} catch (e) {
  console.log("ICE error", e);
}

};

//  CLEANUP
const cleanup = () => {
console.log("🧹 CLEANUP");

if (peerRef.current) {
  peerRef.current.ontrack = null;
  peerRef.current.onicecandidate = null;
  peerRef.current.close();
  peerRef.current = null;
}

if (localStreamRef.current) {
  localStreamRef.current.getTracks().forEach((t) => t.stop());
  localStreamRef.current = null;
}

if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
if (localVideoRef.current) localVideoRef.current.srcObject = null;

};

//  END CALL
const endCall = () => {
if (!peerRef.current) return;

console.log("📴 END CALL");

if (activeCallUserId) {
  socket.emit("end-call", { to: activeCallUserId });
}

cleanup();

callSocket.setCallStatus("idle");
callSocket.setIncomingCall(null);
callSocket.setCallUser(null);
setActiveCallUserId(null);

};

//  MUTE
const isMutedRef = useRef(false);

const toggleMute = () => {
if (!localStreamRef.current) return false;

isMutedRef.current = !isMutedRef.current;

localStreamRef.current.getAudioTracks().forEach((track) => {
  track.enabled = !isMutedRef.current;
});

return isMutedRef.current;

};

return {
startCall,
acceptCall,
setRemoteAnswer,
addIceCandidate,
endCall,
toggleMute,
};
}
