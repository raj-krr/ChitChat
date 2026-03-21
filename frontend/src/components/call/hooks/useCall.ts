import { useEffect, useRef } from "react";
import { socket } from "../../../apis/socket";
import { useGlobalCall } from "../../../context/CallContext";

export function useCall(remoteVideoRef: any, localVideoRef: any, remoteAudioRef: any) {
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  const { setActiveCallUserId, activeCallUserId } = useGlobalCall();
  const callSocket = useGlobalCall();

  // ✅ Two separate ICE queues — one per role.
  // The caller receives ICE from the receiver (flushed in setRemoteAnswer).
  // The receiver receives ICE from the caller (flushed in acceptCall).
  // Using a single shared queue caused each role to flush the other's candidates.
  const callerIceQueueRef = useRef<any[]>([]);   // flushed by setRemoteAnswer
  const receiverIceQueueRef = useRef<any[]>([]); // flushed by acceptCall

  // SOCKET LISTENERS (ONLY ONCE)
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

  // CREATE PEER
  const createPeer = (remoteId: string) => {
    // Always reset remoteStream so ontrack gets a fresh stream each call
    remoteStreamRef.current = new MediaStream();

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
      console.log("🎥 TRACK:", event.track.kind);

      remoteStreamRef.current!.addTrack(event.track);

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
      }

      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStreamRef.current;
        remoteAudioRef.current.muted = false;
        remoteAudioRef.current.volume = 1;
        remoteAudioRef.current.play().catch(() => {});
      }
    };

    peer.onconnectionstatechange = () => {
      console.log("🔗 connection:", peer.connectionState);
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
        console.log("⏱ ICE timeout fallback");
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

  // START CALL (caller side)
  const startCall = async (to: string, user: any, type: "audio" | "video" = "audio") => {
    if (peerRef.current) {
      console.log("♻️ resetting old peer");
      cleanup();
    }

    // ✅ Clear both queues on a fresh call
    callerIceQueueRef.current = [];
    receiverIceQueueRef.current = [];

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
      await waitForIceGathering(peer);

      const offer = peer.localDescription;

      callSocket.setCallType(type);
      callSocket.setCallStatus("calling");
      callSocket.setCallUser(user);

      console.log("📤 EMITTING CALL USER", { to });
      console.log("📡 SOCKET CONNECTED?", socket.connected);

      socket.emit("call-user", { to, offer, user, type });
    } catch (err) {
      console.error("❌ getUserMedia error", err);
    }
  };

  // ACCEPT CALL (receiver side)
  const acceptCall = async (from: string, offer: any, type = "audio") => {
    if (peerRef.current) {
      console.log("♻️ resetting old peer");
      peerRef.current.ontrack = null;
      peerRef.current.onicecandidate = null;
      peerRef.current.close();
      peerRef.current = null;
    }

    // ✅ Clear both queues on a fresh call
    callerIceQueueRef.current = [];
    receiverIceQueueRef.current = [];

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === "video",
    });

    console.log("🎤 LOCAL TRACKS:", stream.getTracks());
    localStreamRef.current = stream;
    setActiveCallUserId(from);

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    const peer = createPeer(from);
    peerRef.current = peer;

    for (const track of stream.getTracks()) {
      console.log("🎯 adding track:", track.kind);
      peer.addTrack(track, stream);
    }

    await peer.setRemoteDescription(new RTCSessionDescription(offer));

    // ✅ Flush the RECEIVER's queue (candidates from caller that arrived early)
    for (const candidate of receiverIceQueueRef.current) {
      await peer.addIceCandidate(new RTCIceCandidate(candidate));
    }
    receiverIceQueueRef.current = [];

    await peer.setLocalDescription(await peer.createAnswer());
    await waitForIceGathering(peer);

    socket.emit("answer-call", { to: from, answer: peer.localDescription });

    callSocket.setCallStatus("connected");
  };

  // ANSWER RECEIVED (caller side)
  const setRemoteAnswer = async (answer: any) => {
    if (!peerRef.current) return;

    await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));

    // ✅ Flush the CALLER's queue (candidates from receiver that arrived early)
    for (const candidate of callerIceQueueRef.current) {
      await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    }
    callerIceQueueRef.current = [];

    callSocket.setCallStatus("connected");
  };

  // ICE CANDIDATE — queues into BOTH, only the right one gets flushed per role
  const addIceCandidate = async (candidate: any) => {
    if (!peerRef.current) return;

    if (!peerRef.current.remoteDescription) {
      console.log("⏳ ICE queued");
      // We don't know yet if we're caller or receiver, so queue into both.
      // acceptCall flushes receiverIceQueueRef; setRemoteAnswer flushes callerIceQueueRef.
      callerIceQueueRef.current.push(candidate);
      receiverIceQueueRef.current.push(candidate);
      return;
    }

    try {
      await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.log("ICE error", e);
    }
  };

  // CLEANUP
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

  // END CALL
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

  // MUTE
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