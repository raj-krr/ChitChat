import { useEffect, useRef } from "react";
import { socket } from "../../../apis/socket";
import { useGlobalCall } from "../../../context/CallContext";

export function useCall() {
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const { setActiveCallUserId, activeCallUserId } = useGlobalCall();
  const callSocket = useGlobalCall();

  // 🔥 CREATE PEER
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
      ],
    });

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice-candidate", {
          to: remoteId,
          candidate: e.candidate,
        });
      }
    };

    // 🔥🔥 FINAL TRACK HANDLER
    peer.ontrack = (event) => {
      const stream = event.streams[0];

      console.log("🎥 TRACK RECEIVED:", stream);

      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();

      console.log("REMOTE VIDEO:", videoTracks);
      console.log("REMOTE AUDIO:", audioTracks);

      // 🎥 VIDEO CASE
      if (videoTracks.length > 0) {
        const remoteVideo = document.getElementById("remote-video") as HTMLVideoElement;

        if (remoteVideo) {
          remoteVideo.srcObject = stream;

          setTimeout(() => {
            remoteVideo.play().catch(() => {
              console.log("⚠️ video autoplay blocked");
            });
          }, 100);
        }
      }

      // 🔊 AUDIO CASE (IMPORTANT)
      if (videoTracks.length === 0 && audioTracks.length > 0) {
        const audio = new Audio();
        audio.srcObject = stream;
        audio.autoplay = true;

        audio.play().catch(() => {
          console.log("⚠️ audio autoplay blocked");
        });
      }
    };

    return peer;
  };

  // 🚀 START CALL
  const startCall = async (
    to: string,
    user: any,
    type: "audio" | "video" = "audio"
  ) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === "video",
      });

      // 🔥 local video
      setTimeout(() => {
        const localVideo = document.getElementById("local-video") as HTMLVideoElement;
        if (localVideo) localVideo.srcObject = stream;
      }, 0);

      localStreamRef.current = stream;
      setActiveCallUserId(to);

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

      console.log("🚀 START CALL:", type);
    } catch (err) {
      console.error("❌ getUserMedia error", err);
    }
  };

  // ✅ ACCEPT CALL
  const acceptCall = async (from: string, offer: any, type = "audio") => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === "video",
    });

    setTimeout(() => {
      const localVideo = document.getElementById("local-video") as HTMLVideoElement;
      if (localVideo) localVideo.srcObject = stream;
    }, 0);

    localStreamRef.current = stream;
    setActiveCallUserId(from);

    const peer = createPeer(from);
    peerRef.current = peer;

    stream.getTracks().forEach((t) => peer.addTrack(t, stream));

    await peer.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    socket.emit("answer-call", { to: from, answer });

    callSocket.setCallStatus("connected");
  };

  // ✅ ANSWER RECEIVED
  const setRemoteAnswer = async (answer: any) => {
    const peer = peerRef.current;
    if (!peer) return;

    if (peer.signalingState === "stable") return;

    await peer.setRemoteDescription(new RTCSessionDescription(answer));
    callSocket.setCallStatus("connected");
  };

  // ✅ ICE
  const addIceCandidate = async (candidate: any) => {
    try {
      if (peerRef.current?.remoteDescription) {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (e) {
      console.log("ICE error", e);
    }
  };

  // 🧹 CLEANUP
  const cleanup = () => {
    peerRef.current?.close();
    peerRef.current = null;

    localStreamRef.current?.getTracks().forEach((t) => t.stop());

    const video = document.getElementById("remote-video") as HTMLVideoElement;
    if (video) video.srcObject = null;
  };

  // ❌ END CALL
  const endCall = () => {
    const to = activeCallUserId;

    if (to) socket.emit("end-call", { to });

    cleanup();

    callSocket.setCallStatus("idle");
    callSocket.setIncomingCall(null);
    callSocket.setCallUser(null);
    callSocket.setCallType("audio");

    setActiveCallUserId(null);
  };

  useEffect(() => {
    const handleEnd = () => {
      console.log("📴 call-ended received");

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

  // 🔇 MUTE
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
    cleanup,
    toggleMute,
  };
}