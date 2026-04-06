import { useEffect, useRef, useCallback } from "react";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "wss://oran.onrender.com";

export function useWebRTC(
  currentUserId: string,
  activeUserIds: string[],
  micStreamRef: React.RefObject<MediaStream | null>,
  micOn: boolean
) {
  const wsRef = useRef<WebSocket | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingCandidates = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

  const addPendingCandidates = async (pc: RTCPeerConnection, fromId: string) => {
    console.log("🎤 local stream:", micStreamRef.current);
    const candidates = pendingCandidates.current.get(fromId) || [];
    for (const c of candidates) {
      try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
    }
    pendingCandidates.current.delete(fromId);
  };

  const createPeer = useCallback((targetId: string, isInitiator: boolean) => {
    if (peersRef.current.has(targetId)) return peersRef.current.get(targetId)!;

    console.log(`[WebRTC] creating peer ${targetId}, initiator=${isInitiator}`);

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });

    // Add mic track if available
    const stream = micStreamRef.current;
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        console.log("🎤 adding track", track);
        pc.addTrack(track, stream)});
    } else {
      // Add empty audio track as placeholder so the sender slot exists
      const emptyStream = new MediaStream();
      const ctx = new AudioContext();
      const dest = ctx.createMediaStreamDestination();
      const silentTrack = dest.stream.getAudioTracks()[0];
      emptyStream.addTrack(silentTrack);
      pc.addTrack(silentTrack, emptyStream);
    }

pc.ontrack = (e) => {
  
  console.log(" TRACK RECEIVED", e.streams);
  console.log("[WebRTC] got remote track", e);

  let audio = document.getElementById(`audio-${targetId}`) as HTMLAudioElement;

  if (!audio) {
    audio = document.createElement("audio");
    audio.id = `audio-${targetId}`;
    audio.autoplay = true;
    audio.controls = true; // 👈 for debugging
    audio.setAttribute("playsinline", "true"); 
    document.body.appendChild(audio);
  }

  audio.srcObject = e.streams[0];

  audio.play().catch((err) => {
    console.error("❌ audio play failed", err);
  }).catch((err) => {
    console.error("❌ audio play failed", err);
  });
};

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        wsRef.current?.send(JSON.stringify({
          type: "ice-candidate",
          target: targetId,
          candidate: e.candidate.toJSON(),
        }));
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] ${targetId} state: ${pc.connectionState}`);
      if (pc.connectionState === "failed") {
        pc.close();
        peersRef.current.delete(targetId);
      }
    };

    pc.onicegatheringstatechange = () => {
      console.log(`[WebRTC] ICE gathering ${targetId}: ${pc.iceGatheringState}`);
    };

    if (isInitiator) {
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          wsRef.current?.send(JSON.stringify({
            type: "offer",
            target: targetId,
            sdp: pc.localDescription,
          }));
          console.log(`[WebRTC] sent offer to ${targetId}`);
        })
        .catch(console.error);
    }

    peersRef.current.set(targetId, pc);
    return pc;
  }, [micStreamRef]);

  // Sync mic track to all peers when micOn changes
  useEffect(() => {
    const stream = micStreamRef.current;
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;

    peersRef.current.forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === "audio");
      if (sender) {
         console.log(" replacing silent track with real mic");
        sender.replaceTrack(audioTrack).catch(console.error);
       audioTrack.enabled = true;
      }
    });
  }, [micOn, micStreamRef]);

  // WebSocket setup — connects to /signal path now
  useEffect(() => {
    if (!currentUserId) return;

    const url = new URL(WS_URL);
    url.pathname = "/signal";
    // carry existing query params (token, projectId) if needed
    const ws = new WebSocket(url.toString());
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[WebRTC] signal WS connected");
    };

    ws.onmessage = async (e) => {
      let msg: any;
      try { msg = JSON.parse(e.data); } catch { return; }

      // Ignore presence messages
      if (msg.type === "presence") return;

      console.log(`[WebRTC] received ${msg.type} from ${msg.from}`);

      if (msg.type === "offer") {
        // Only the peer with the lexicographically SMALLER id answers
        // This prevents both peers from offering simultaneously
        const pc = createPeer(msg.from, false);
        await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
        await addPendingCandidates(pc, msg.from);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        ws.send(JSON.stringify({ type: "answer", target: msg.from, sdp: answer }));
        console.log(`[WebRTC] sent answer to ${msg.from}`);
      }

      if (msg.type === "answer") {
        const pc = peersRef.current.get(msg.from);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
          await addPendingCandidates(pc, msg.from);
        }
      }

      if (msg.type === "ice-candidate") {
        const pc = peersRef.current.get(msg.from);
        if (pc && pc.remoteDescription) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
          } catch {}
        } else {
          // Buffer candidates that arrive before remote description is set
          if (!pendingCandidates.current.has(msg.from)) {
            pendingCandidates.current.set(msg.from, []);
          }
          pendingCandidates.current.get(msg.from)!.push(msg.candidate);
        }
      }
    };

    ws.onerror = (e) => console.error("[WebRTC] WS error", e);

    return () => {
      ws.close();
      peersRef.current.forEach((pc) => pc.close());
      peersRef.current.clear();
    };
  }, [currentUserId, createPeer]);

  // Only the user with the LARGER userId initiates — prevents double offers
  useEffect(() => {
    activeUserIds.forEach((uid) => {
      if (uid !== currentUserId && !peersRef.current.has(uid)) {
        const shouldInitiate = currentUserId > uid; // only one side initiates
        createPeer(uid, shouldInitiate);
      }
    });

    peersRef.current.forEach((pc, uid) => {
      if (!activeUserIds.includes(uid)) {
        pc.close();
        peersRef.current.delete(uid);
      }
    });
  }, [activeUserIds, currentUserId, createPeer]);
}