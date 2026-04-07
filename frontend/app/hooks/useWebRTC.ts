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
  const audioElements = useRef<Map<string, HTMLAudioElement>>(new Map());

  const signalPeers = useRef<Map<string, RTCPeerConnection>>(new Map());
  const mySignalId = useRef<string | null>(null);

  const addPendingCandidates = async (pc: RTCPeerConnection, fromId: string) => {
    const candidates = pendingCandidates.current.get(fromId) || [];
    for (const c of candidates) {
      try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
    }
    pendingCandidates.current.delete(fromId);
  };

  const createPeer = useCallback((targetSignalId: string, isInitiator: boolean) => {
    if (signalPeers.current.has(targetSignalId)) {
      return signalPeers.current.get(targetSignalId)!;
    }

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });

    const stream = micStreamRef.current;
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        if (track.readyState === "live") pc.addTrack(track, stream);
      });
    }

    pc.ontrack = (e) => {
      let audio = audioElements.current.get(targetSignalId);
      if (!audio) {
        audio = document.createElement("audio");
        audio.id = `audio-${targetSignalId}`;
        audio.autoplay = true;
        audio.muted = false;
        audio.setAttribute("playsinline", "true");
        document.body.appendChild(audio);
        audioElements.current.set(targetSignalId, audio);
      }
      audio.srcObject = e.streams[0];
      audio.play().catch(() => {});
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        wsRef.current?.send(JSON.stringify({
          type: "ice-candidate",
          target: targetSignalId,   
          candidate: e.candidate.toJSON(),
        }));
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        pc.close();
        signalPeers.current.delete(targetSignalId);
        audioElements.current.get(targetSignalId)?.remove();
        audioElements.current.delete(targetSignalId);
      }
    };

    if (isInitiator) {
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          wsRef.current?.send(JSON.stringify({
            type: "offer",
            target: targetSignalId,  
            sdp: pc.localDescription,
          }));
        })
        .catch(console.error);
    }

    signalPeers.current.set(targetSignalId, pc);
    return pc;
  }, [micStreamRef]);

 
  useEffect(() => {
    const stream = micStreamRef.current;
    if (!stream) return;
    const track = stream.getAudioTracks()[0];
    if (!track || track.readyState !== "live") return;

    signalPeers.current.forEach((pc) => {
      if (pc.connectionState === "closed") return;
      const sender = pc.getSenders().find((s) => s.track?.kind === "audio");
      if (sender) sender.replaceTrack(track).catch(() => {});
      else pc.addTrack(track, stream);
    });
  }, [micOn, micStreamRef]);

  useEffect(() => {
    if (!currentUserId) return;
    const url = new URL(WS_URL);
    url.pathname = "/signal";
    const ws = new WebSocket(url.toString());
    wsRef.current = ws;

    ws.onmessage = async (e) => {
      let msg: any;
      try { msg = JSON.parse(e.data); } catch { return; }

      if (msg.type === "self-id") {
        mySignalId.current = msg.userId;
        return;
      }

  
      if (msg.type === "peer-joined") {
        const theirId: string = msg.userId;
        if (theirId === mySignalId.current) return; 
        if (!signalPeers.current.has(theirId)) {
          const shouldInitiate = (mySignalId.current ?? "") > theirId;
          createPeer(theirId, shouldInitiate);
        }
        return;
      }

      if (msg.type === "presence") return;

      if (msg.type === "offer") {
        const pc = createPeer(msg.from, false);
        await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
        await addPendingCandidates(pc, msg.from);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        ws.send(JSON.stringify({ type: "answer", target: msg.from, sdp: answer }));
      }

      if (msg.type === "answer") {
        const pc = signalPeers.current.get(msg.from);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
          await addPendingCandidates(pc, msg.from);
        }
      }

      if (msg.type === "ice-candidate") {
        const pc = signalPeers.current.get(msg.from);
        if (pc && pc.remoteDescription) {
          try { await pc.addIceCandidate(new RTCIceCandidate(msg.candidate)); } catch {}
        } else {
          if (!pendingCandidates.current.has(msg.from)) {
            pendingCandidates.current.set(msg.from, []);
          }
          pendingCandidates.current.get(msg.from)!.push(msg.candidate);
        }
      }
    };

    ws.onerror = (e) => console.error(e);
    return () => {
      ws.close();
      signalPeers.current.forEach((pc) => pc.close());
      signalPeers.current.clear();
    };
  }, [currentUserId, createPeer]);



  const toggleSpeaker = (userId: string, enabled: boolean) => {
    
    const audio = audioElements.current.get(userId);
    if (audio) audio.muted = !enabled;
  };

  return { toggleSpeaker };
}