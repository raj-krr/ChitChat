import { useEffect, useRef } from "react";
import { socket } from "../../../apis/socket";
import { useGlobalCall } from "../../../context/CallContext";

export function useCall() {
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const { setActiveCallUserId, activeCallUserId } = useGlobalCall();

  const callSocket = useGlobalCall();

  //CREATE PEER
  const createPeer = (remoteId: string) => {
    const peer = new RTCPeerConnection({
      iceServers: [
  { urls: "stun:stun.l.google.com:19302" },

  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
]
    });

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice-candidate", {
          to: remoteId,
          candidate: e.candidate,
        });
      }
    };
peer.ontrack = (event) => {
  const stream = event.streams[0];

  let video = document.getElementById("remote-video") as HTMLVideoElement;

  if (!video) {
    video = document.createElement("video");
    video.id = "remote-video";
    video.autoplay = true;
    video.playsInline = true;
    video.muted = false; // 🔥 IMPORTANT
    video.className = "fixed inset-0 w-full h-full object-cover z-40";
    document.body.appendChild(video);
  }

  video.srcObject = stream;

  // 🔥 FORCE PLAY (mobile fix)
  setTimeout(() => {
    video.play().catch(() => {
      console.log("autoplay blocked");
    });
  }, 100);
};

    return peer;
  };

  const startCall = async (to: string, user: any) => {
    try {
     const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
  video: {
    width: 1280,
    height: 720,
    facingMode: "user",
  },
     });
      const localVideo = document.getElementById("local-video") as HTMLVideoElement;

if (localVideo) {
  localVideo.srcObject = stream;
}

      localStreamRef.current = stream;
      setActiveCallUserId(to);

      const peer = createPeer(to);
      peerRef.current = peer;
console.log(localStreamRef.current?.getAudioTracks());
      stream.getTracks().forEach((t) => peer.addTrack(t, stream));
stream.getAudioTracks().forEach((track) => {
  track.enabled = true; // 🔥 FORCE ENABLE
  console.log("🎤 mic track:", track.enabled, track.readyState);
});
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      socket.emit("call-user", {
        to,
        offer,
        user, 
      });

      callSocket.setCallStatus("calling");
      callSocket.setCallUser(user);
      console.log("🎤 sending tracks:", stream.getTracks());
    } catch (err) {
      console.error("Mic permission denied");
    }
  };

  const acceptCall = async (from: string, offer: any) => {
   const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
  video: {
    width: 1280,
    height: 720,
    facingMode: "user",
  },
});

    const localVideo = document.getElementById("local-video") as HTMLVideoElement;

if (localVideo) {
  localVideo.srcObject = stream;
}
    localStreamRef.current = stream;
    setActiveCallUserId(from);

    const peer = createPeer(from);
    peerRef.current = peer;

    stream.getTracks().forEach((t) => peer.addTrack(t, stream));
stream.getAudioTracks().forEach((track) => {
  track.enabled = true; // 🔥 FORCE ENABLE
  console.log("🎤 mic track:", track.enabled, track.readyState);
});
    await peer.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    socket.emit("answer-call", { to: from, answer });

    callSocket.setCallStatus("connected");
  };

  const setRemoteAnswer = async (answer: any) => {
    const peer = peerRef.current;
    if (!peer) return;

    if (peer.signalingState === "stable") return;

    await peer.setRemoteDescription(new RTCSessionDescription(answer));

    callSocket.setCallStatus("connected");
  };

  const addIceCandidate = async (candidate: any) => {
    try {
      await peerRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
    } catch {}
  };

  const cleanup = () => {
    peerRef.current?.close();
    peerRef.current = null;

    localStreamRef.current?.getTracks().forEach((t) => t.stop());

    const audio = document.getElementById("remote-audio");
    if (audio) {
      (audio as HTMLAudioElement).srcObject = null;
      audio.remove();
    }

    const video = document.getElementById("remote-video");
if (video) {
  (video as HTMLVideoElement).srcObject = null;
  video.remove();
}

  };

 const endCall = () => {
  const to = activeCallUserId;

  console.log("ENDING CALL TO:", to);

  if (to) {
    socket.emit("end-call", { to });
  }

  cleanup();

  callSocket.setCallStatus("idle");
  callSocket.setIncomingCall(null);
  callSocket.setCallUser(null);
  setActiveCallUserId(null);
};

  useEffect(() => {
    const handleEnd = () => {
      cleanup();

      callSocket.setCallStatus("idle");
      callSocket.setIncomingCall(null);
      callSocket.setCallUser(null);
    };

    socket.on("call-ended", handleEnd);

    return () => {
      socket.off("call-ended", handleEnd);
    };
  }, []);

  const isMutedRef = useRef(false);

  const toggleMute = () => {
    if (!localStreamRef.current) return false;

    isMutedRef.current = !isMutedRef.current;

    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !isMutedRef.current;
    });

    return isMutedRef.current; 
  };

  const toggleSpeaker = () => {
    const audio = document.getElementById("remote-audio") as HTMLAudioElement;
    if (!audio) return;

    audio.volume = audio.volume === 1 ? 0.3 : 1;
  };

  return {
    startCall,
    acceptCall,
    setRemoteAnswer,
    addIceCandidate,
    endCall,
    cleanup,
    toggleMute,
    toggleSpeaker,
  };
}