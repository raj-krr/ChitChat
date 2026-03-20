import { useEffect, useRef } from "react";
import { socket } from "../../../apis/socket";
import { useGlobalCall } from "../../../context/CallContext";

export function useCall(remoteVideoRef: any, localVideoRef: any, remoteAudioRef: any) {
const peerRef = useRef<RTCPeerConnection | null>(null);
const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  
const { setActiveCallUserId, activeCallUserId } = useGlobalCall();
const callSocket = useGlobalCall();
const iceQueueRef = useRef<any[]>([]);
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


peer.ontrack = (event) => {
  console.log("🎥 TRACK:", event.track.kind);

  if (!remoteStreamRef.current) {
    remoteStreamRef.current = new MediaStream();
  }

  remoteStreamRef.current.addTrack(event.track);

  // 🎥 VIDEO
  if (remoteVideoRef.current) {
    remoteVideoRef.current.srcObject = remoteStreamRef.current;
  }

  // 🔊 AUDIO
  if (remoteAudioRef.current) {
    remoteAudioRef.current.srcObject = remoteStreamRef.current;
    remoteAudioRef.current.muted = false;
    remoteAudioRef.current.volume = 1;
     remoteAudioRef.current.play().catch(() => {});
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

 for (const track of stream.getTracks()) {
  peer.addTrack(track, stream);
  }
  console.log("🎯 SENDERS:", peer.getSenders());

await peer.setLocalDescription(await peer.createOffer());

//  WAIT FOR ICE GATHERING (IMPORTANT)
await new Promise((resolve) => {
  let timeout = setTimeout(() => {
    console.log("⏱ ICE timeout fallback");
    resolve(true);
  }, 2000); 

  if (peer.iceGatheringState === "complete") {
    clearTimeout(timeout);
    resolve(true);
  } else {
    const checkState = () => {
      if (peer.iceGatheringState === "complete") {
        clearTimeout(timeout);
        peer.removeEventListener("icegatheringstatechange", checkState);
        resolve(true);
      }
    };
    peer.addEventListener("icegatheringstatechange", checkState);
  }
});

const offer = peer.localDescription;

  peer.onconnectionstatechange = () => {
  console.log("🔗 connection:", peer.connectionState);
};
  callSocket.setCallType(type);

    callSocket.setCallStatus("calling");
  callSocket.setCallUser(user);
  console.log("📤 EMITTING CALL USER", { to });
  console.log("📡 SOCKET CONNECTED?", socket.connected);
  socket.emit("call-user", {
    to,
    offer,
    user,
    type,
  });

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

for (const track of stream.getTracks()) {
  peer.addTrack(track, stream);
}

await peer.setRemoteDescription(new RTCSessionDescription(offer));
// flush ICE queue
for (const candidate of iceQueueRef.current) {
  await peer.addIceCandidate(new RTCIceCandidate(candidate));
}
iceQueueRef.current = [];
await peer.setLocalDescription(await peer.createAnswer());

await new Promise((resolve) => {
  let timeout = setTimeout(() => {
    console.log("⏱ ICE timeout fallback");
    resolve(true);
  }, 2000); 

  if (peer.iceGatheringState === "complete") {
    clearTimeout(timeout);
    resolve(true);
  } else {
    const checkState = () => {
      if (peer.iceGatheringState === "complete") {
        clearTimeout(timeout);
        peer.removeEventListener("icegatheringstatechange", checkState);
        resolve(true);
      }
    };
    peer.addEventListener("icegatheringstatechange", checkState);
  }
});
    
const answer = peer.localDescription;

socket.emit("answer-call", { to: from, answer });

callSocket.setCallStatus("connected");

};

// ANSWER RECEIVED
const setRemoteAnswer = async (answer: any) => {
if (!peerRef.current) return;


await peerRef.current.setRemoteDescription(
  new RTCSessionDescription(answer)
);

for (const candidate of iceQueueRef.current) {
  await peerRef.current.addIceCandidate(
    new RTCIceCandidate(candidate)
  );
}
  iceQueueRef.current = [];
  
callSocket.setCallStatus("connected");

};
//  ICE
const addIceCandidate = async (candidate: any) => {
  if (!peerRef.current) return;

  if (!peerRef.current.remoteDescription) {
    console.log("⏳ ICE queued");
    iceQueueRef.current.push(candidate);
    return;
  }

  try {
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

  remoteStreamRef.current = null;
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
