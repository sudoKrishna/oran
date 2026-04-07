import { useEffect, useRef, useCallback, useState } from "react";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "wss://oran.onrender.com";

export function useWebRTC(
  currentUserId: string,
  activeUserIds: string[],
  micStreamRef: React.RefObject<MediaStream | null>,
  micOn: boolean
) {
  const wsRef = useRef<WebSocket | null>(null);
  const signalPeers = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingCandidates = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const audioElements = useRef<Map<string, HTMLAudioElement>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const mySignalId = useRef<string | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  //  STEP 1: Unlock AudioContext on first user gesture (like Meet/Discord)
  const unlockAudio = useCallback(async () => {
    if (audioUnlocked) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }
      // Play a silent buffer to fully unlock audio output
      const buffer = audioContextRef.current.createBuffer(1, 1, 22050);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.start();

      // Also try to play all existing audio elements
      audioElements.current.forEach((audio) => {
        audio.play().catch(() => {});
      });

      setAudioUnlocked(true);
      console.log("🔊 Audio unlocked");
    } catch (e) {
      console.error("Audio unlock failed:", e);
    }
  }, [audioUnlocked]);

  // Auto-attach unlock to window on first interaction
  useEffect(() => {
    if (audioUnlocked) return;
    const events = ["click", "touchstart", "keydown", "pointerdown"];
    const handler = () => {
      unlockAudio();
      events.forEach((ev) => window.removeEventListener(ev, handler));
    };
    events.forEach((ev) => window.addEventListener(ev, handler, { once: true }));
    return () => events.forEach((ev) => window.removeEventListener(ev, handler));
  }, [audioUnlocked, unlockAudio]);

  //  STEP 2: Properly create and attach audio element (Discord/Meet style)
  const attachAudio = useCallback((targetSignalId: string, stream: MediaStream) => {
    // Remove old element if any
    const old = audioElements.current.get(targetSignalId);
    if (old) {
      old.srcObject = null;
      old.remove();
    }

    const audio = document.createElement("audio");
    audio.id = `rtc-audio-${targetSignalId}`;
    audio.autoplay = true;
    audio.muted = false;
    audio.volume = 1.0;
    audio.setAttribute("playsinline", "true");

    // Critical: must be in DOM for autoplay to work in most browsers
    audio.style.display = "none";
    document.body.appendChild(audio);

    audio.srcObject = stream;
    audioElements.current.set(targetSignalId, audio);

  
    const tryPlay = async (attempts = 0) => {
      try {
        await audio.play();
        console.log(`🔊 Playing audio from ${targetSignalId}`);
      } catch (err: any) {
        if (err.name === "NotAllowedError" && attempts < 5) {
        
          setTimeout(() => tryPlay(attempts + 1), 500);
        } else {
          console.error(`Audio play failed for ${targetSignalId}:`, err);
        }
      }
    };

    tryPlay();
    return audio;
  }, []);

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
        //  Add TURN for users behind strict NAT (like mobile networks)
        // If you have a TURN server, add it here:
        // { urls: "turn:your-turn-server.com", username: "user", credential: "pass" }
      ],
    });

    // Add mic track if available
    const stream = micStreamRef.current;
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        if (track.readyState === "live") pc.addTrack(track, stream);
      });
    } else {
      //  Add empty audio transceiver so remote can still send audio to us
      pc.addTransceiver("audio", { direction: "recvonly" });
    }

   
    pc.ontrack = (e) => {
      console.log(`🎵 Got track from ${targetSignalId}:`, e.track.kind);
      if (e.track.kind !== "audio") return;

      const inboundStream = e.streams[0] || new MediaStream([e.track]);
      attachAudio(targetSignalId, inboundStream);
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
      console.log(`[WebRTC] ${targetSignalId} →`, pc.connectionState);
      if (pc.connectionState === "connected") {
        // Connection established — ensure audio is playing
        const audio = audioElements.current.get(targetSignalId);
        if (audio && audio.paused) audio.play().catch(() => {});
      }
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        pc.close();
        signalPeers.current.delete(targetSignalId);
        const audio = audioElements.current.get(targetSignalId);
        if (audio) { audio.srcObject = null; audio.remove(); }
        audioElements.current.delete(targetSignalId);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[ICE] ${targetSignalId} →`, pc.iceConnectionState);
    };

    if (isInitiator) {
      pc.createOffer({ offerToReceiveAudio: true })
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
  }, [micStreamRef, attachAudio]);

  // Replace tracks when mic toggles
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

    ws.onopen = () => console.log("[Signal WS] connected");

    ws.onmessage = async (e) => {
      let msg: any;
      try { msg = JSON.parse(e.data); } catch { return; }

      if (msg.type === "self-id") {
        mySignalId.current = msg.userId;
        console.log("[Signal] My ID:", msg.userId);
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

    ws.onerror = (e) => console.error("[Signal WS] error", e);

    return () => {
      ws.close();
      signalPeers.current.forEach((pc) => pc.close());
      signalPeers.current.clear();
      audioElements.current.forEach((a) => { a.srcObject = null; a.remove(); });
      audioElements.current.clear();
    };
  }, [currentUserId, createPeer]);

  const toggleSpeaker = useCallback((userId: string, enabled: boolean) => {
    const audio = audioElements.current.get(userId);
    if (audio) {
      audio.muted = !enabled;
      if (enabled && audio.paused) audio.play().catch(() => {});
    }
  }, []);

  return { toggleSpeaker, unlockAudio, audioUnlocked };
}