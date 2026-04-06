import { useEffect, useRef } from "react";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "wss://oran.onrender.com";

export function useWebRTC(currentUserId: string, activeUserIds: string[]) {
  const wsRef = useRef<WebSocket | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  const createPeer = (targetId: string, isInitiator: boolean) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    // Add local audio tracks
    localStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current!);
    });

    // Play remote audio
    pc.ontrack = (e) => {
      const audio = new Audio();
      audio.srcObject = e.streams[0];
      audio.autoplay = true;
    };

    // Send ICE candidates via signaling
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        wsRef.current?.send(JSON.stringify({
          type: "ice-candidate",
          target: targetId,
          candidate: e.candidate,
        }));
      }
    };

    if (isInitiator) {
      pc.createOffer().then((offer) => {
        pc.setLocalDescription(offer);
        wsRef.current?.send(JSON.stringify({
          type: "offer",
          target: targetId,
          sdp: offer,
        }));
      });
    }

    peersRef.current.set(targetId, pc);
    return pc;
  };

  useEffect(() => {
    // Get mic stream once
    navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then((stream) => {
      localStreamRef.current = stream;
    });

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "register", userId: currentUserId }));
    };

    ws.onmessage = async (e) => {
      const msg = JSON.parse(e.data);

      if (msg.type === "offer") {
        const pc = createPeer(msg.from, false);
        await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        ws.send(JSON.stringify({ type: "answer", target: msg.from, sdp: answer }));
      }

      if (msg.type === "answer") {
        const pc = peersRef.current.get(msg.from);
        await pc?.setRemoteDescription(new RTCSessionDescription(msg.sdp));
      }

      if (msg.type === "ice-candidate") {
        const pc = peersRef.current.get(msg.from);
        await pc?.addIceCandidate(new RTCIceCandidate(msg.candidate));
      }
    };

    return () => {
      ws.close();
      peersRef.current.forEach((pc) => pc.close());
    };
  }, [currentUserId]);

  
  useEffect(() => {
    activeUserIds.forEach((uid) => {
      if (uid !== currentUserId && !peersRef.current.has(uid)) {
        createPeer(uid, true);
      }
    });
  }, [activeUserIds, currentUserId]);
}