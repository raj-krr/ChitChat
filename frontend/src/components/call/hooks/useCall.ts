import { useEffect, useRef } from "react";
import { socket } from "../../../apis/socket";
import { useGlobalCall } from "../../../context/CallContext";

export function useCall(remoteVideoRef: any, localVideoRef: any, remoteAudioRef: any) {
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  const { setActiveCallUserId, activeCallUserId } = useGlobalCall();
  const callSocket = useGlobalCall();

  const pendingIceCandidatesRef = useRef<any[]>([]);

  const setRemoteAnswerRef = useRef<((answer: any) => Promise<void>) | undefined>(undefined);
  const addIceCandidateRef = useRef<((candidate: any) => Promise<void>) | undefined>(undefined);
  const cleanupRef = useRef<(() => void) | undefined>(undefined);

  // Mute / camera / speaker state refs
  const isMutedRef = useRef(false);
  const isSpeakerMutedRef = useRef(false);

  // SOCKET LISTENERS
  useEffect(() => {
    const handleAnswer = ({ answer }: any) => {
      setRemoteAnswerRef.current?.(answer);
    };

    const handleIce = ({ candidate }: any) => {
      addIceCandidateRef.current?.(candidate);
    };

    const handleCallEnded = () => {
      cleanupRef.current?.();
      callSocket.setCallStatus("idle");
      callSocket.setIncomingCall(null);
      callSocket.setCallUser(null);
      setActiveCallUserId(null);
    };

    socket.on("call-answered", handleAnswer);
    socket.on("ice-candidate", handleIce);
    socket.on("call-ended", handleCallEnded);

    return () => {
      socket.off("call-answered", handleAnswer);
      socket.off("ice-candidate", handleIce);
      socket.off("call-ended", handleCallEnded);
    };
  }, []);

  // Ensure video refs stay bound to streams on render
  useEffect(() => {
    if (localStreamRef.current && localVideoRef.current) {
      if (localVideoRef.current.srcObject !== localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      localVideoRef.current.play().catch(() => {});
    }
    if (remoteStreamRef.current && remoteVideoRef.current) {
      if (remoteVideoRef.current.srcObject !== remoteStreamRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
      }
      remoteVideoRef.current.play().catch(() => {});
    }
  });

  // CREATE PEER
  const createPeer = (remoteId: string) => {
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: ["stun:stun.l.google.com:19302"] },
        {
          urls: [
            "turn:global.relay.metered.ca:80",
            "turn:global.relay.metered.ca:80?transport=tcp",
            "turn:global.relay.metered.ca:443",
            "turns:global.relay.metered.ca:443?transport=tcp",
          ],
          username: "02d63ed20c3a50f2efc67dc5",
          credential: "vcVLobIoZOjeg5L9",
        },
      ],
    });

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice-candidate", { to: remoteId, candidate: e.candidate });
      }
    };

    peer.ontrack = (event) => {
      const stream = event.streams[0] || remoteStreamRef.current || new MediaStream();
      remoteStreamRef.current = stream;

      if (event.track && !stream.getTracks().includes(event.track)) {
        stream.addTrack(event.track);
      }

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
        remoteVideoRef.current.play().catch(() => {});
      }

      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream;
        remoteAudioRef.current.muted = isSpeakerMutedRef.current;
        remoteAudioRef.current.volume = 1;
        remoteAudioRef.current.play().catch(() => {});
      }
    };

    peer.onconnectionstatechange = () => {
      console.log("🔗 WebRTC connection state:", peer.connectionState);
    };

    return peer;
  };

  // ICE GATHER HELPER
  const waitForIceGathering = (peer: RTCPeerConnection): Promise<void> => {
    return new Promise((resolve) => {
      if (peer.iceGatheringState === "complete") {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        peer.removeEventListener("icegatheringstatechange", checkState);
        resolve();
      }, 2000);

      const checkState = () => {
        if (peer.iceGatheringState === "complete") {
          clearTimeout(timeout);
          peer.removeEventListener("icegatheringstatechange", checkState);
          resolve();
        }
      };

      peer.addEventListener("icegatheringstatechange", checkState);
    });
  };

  // START CALL (Caller side)
  const startCall = async (to: string, user: any, type: "audio" | "video" = "audio") => {
    if (peerRef.current) {
      cleanup();
    }

    pendingIceCandidatesRef.current = [];
    isMutedRef.current = false;
    isSpeakerMutedRef.current = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
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

      await peer.setLocalDescription(await peer.createOffer());
      await waitForIceGathering(peer);

      callSocket.setCallType(type);
      callSocket.setCallStatus("calling");
      callSocket.setCallUser(user);

      socket.emit("call-user", { to, offer: peer.localDescription, user, type });
    } catch (err) {
      console.error("❌ getUserMedia error", err);
    }
  };

  // ACCEPT CALL (Receiver side)
  const acceptCall = async (from: string, offer: any, type = "audio") => {
    if (peerRef.current) {
      cleanup();
    }

    pendingIceCandidatesRef.current = [];
    isMutedRef.current = false;
    isSpeakerMutedRef.current = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
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

      // Flush queued candidates
      for (const candidate of pendingIceCandidatesRef.current) {
        try {
          await peer.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {}
      }
      pendingIceCandidatesRef.current = [];

      await peer.setLocalDescription(await peer.createAnswer());
      await waitForIceGathering(peer);

      socket.emit("answer-call", { to: from, answer: peer.localDescription });

      if (remoteAudioRef.current && remoteStreamRef.current) {
        remoteAudioRef.current.srcObject = remoteStreamRef.current;
        remoteAudioRef.current.muted = false;
        remoteAudioRef.current.volume = 1;
        remoteAudioRef.current.play().catch(() => {});
      }

      callSocket.setCallStatus("connected");
    } catch (err) {
      console.error("❌ acceptCall error", err);
    }
  };

  // ANSWER RECEIVED (Caller side)
  const setRemoteAnswer = async (answer: any) => {
    if (!peerRef.current) return;

    try {
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));

      for (const candidate of pendingIceCandidatesRef.current) {
        try {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {}
      }
      pendingIceCandidatesRef.current = [];

      // Ensure caller's remote audio element plays
      if (remoteAudioRef.current && remoteStreamRef.current) {
        remoteAudioRef.current.srcObject = remoteStreamRef.current;
        remoteAudioRef.current.muted = false;
        remoteAudioRef.current.volume = 1;
        remoteAudioRef.current.play().catch(() => {});
      }

      callSocket.setCallStatus("connected");
    } catch (err) {
      console.error("❌ setRemoteAnswer error", err);
    }
  };
  setRemoteAnswerRef.current = setRemoteAnswer;

  // ADD ICE CANDIDATE
  const addIceCandidate = async (candidate: any) => {
    if (!peerRef.current) return;

    if (!peerRef.current.remoteDescription) {
      pendingIceCandidatesRef.current.push(candidate);
      return;
    }

    try {
      await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.log("ICE error", e);
    }
  };
  addIceCandidateRef.current = addIceCandidate;

  // CLEANUP
  const cleanup = () => {
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
    pendingIceCandidatesRef.current = [];
  };
  cleanupRef.current = cleanup;

  // END CALL
  const endCall = () => {
    if (activeCallUserId) {
      socket.emit("end-call", { to: activeCallUserId });
    }

    cleanup();

    callSocket.setCallStatus("idle");
    callSocket.setIncomingCall(null);
    callSocket.setCallUser(null);
    setActiveCallUserId(null);
  };

  // TOGGLE MUTE
  const toggleMute = () => {
    if (!localStreamRef.current) return false;
    isMutedRef.current = !isMutedRef.current;
    localStreamRef.current.getAudioTracks().forEach((t) => {
      t.enabled = !isMutedRef.current;
    });
    return isMutedRef.current;
  };

  // SWITCH CAMERA
  const facingModeRef = useRef<"user" | "environment">("user");

  const switchCamera = async (): Promise<boolean> => {
    if (!localStreamRef.current || !peerRef.current) return false;

    facingModeRef.current =
      facingModeRef.current === "user" ? "environment" : "user";

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingModeRef.current },
        audio: false,
      });

      const newVideoTrack = newStream.getVideoTracks()[0];

      const sender = peerRef.current
        .getSenders()
        .find((s) => s.track?.kind === "video");

      if (sender) {
        await sender.replaceTrack(newVideoTrack);
      }

      const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
      if (oldVideoTrack) {
        oldVideoTrack.stop();
        localStreamRef.current.removeTrack(oldVideoTrack);
      }
      localStreamRef.current.addTrack(newVideoTrack);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }

      return true;
    } catch (err) {
      console.error("switchCamera error", err);
      facingModeRef.current =
        facingModeRef.current === "user" ? "environment" : "user";
      return false;
    }
  };

  // TOGGLE SPEAKER
  const toggleSpeaker = () => {
    isSpeakerMutedRef.current = !isSpeakerMutedRef.current;
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = isSpeakerMutedRef.current;
    }
    return isSpeakerMutedRef.current;
  };

  return {
    startCall,
    acceptCall,
    setRemoteAnswer,
    addIceCandidate,
    endCall,
    toggleMute,
    switchCamera,
    toggleSpeaker,
  };
}