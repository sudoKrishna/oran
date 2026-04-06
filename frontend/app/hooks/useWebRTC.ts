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

  //  store audio elements for speaker control
  const audioElements = useRef<Map<string, HTMLAudioElement>>(new Map());

  const addPendingCandidates = async (pc: RTCPeerConnection, fromId: string) => {
    const candidates = pendingCandidates.current.get(fromId) || [];
    for (const c of candidates) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      } catch {}
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

    //  ONLY add real mic track (NO fake/silent track)
    const stream = micStreamRef.current;
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        if (track.readyState === "live") {
          console.log("🎤 adding LIVE track", track);
          pc.addTrack(track, stream);
        } else {
          console.warn("⚠️ skipping dead track", track);
        }
      });
    }

    // 🔊 RECEIVE AUDIO
    pc.ontrack = (e) => {
      console.log("🔥 TRACK RECEIVED from", targetId);

      let audio = audioElements.current.get(targetId);

      if (!audio) {
        audio = document.createElement("audio");
        audio.id = `audio-${targetId}`;
        audio.autoplay = true;
        audio.controls = true; // debug
        audio.setAttribute("playsinline", "true");

        document.body.appendChild(audio);
        audioElements.current.set(targetId, audio);
      }

      audio.srcObject = e.streams[0];

      audio.play().catch((err) => {
        console.error("❌ audio play failed", err);
      });
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        wsRef.current?.send(
          JSON.stringify({
            type: "ice-candidate",
            target: targetId,
            candidate: e.candidate.toJSON(),
          })
        );
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] ${targetId} state: ${pc.connectionState}`);

      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        pc.close();
        peersRef.current.delete(targetId);
        audioElements.current.delete(targetId);
      }
    };

    if (isInitiator) {
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          wsRef.current?.send(
            JSON.stringify({
              type: "offer",
              target: targetId,
              sdp: pc.localDescription,
            })
          );
          console.log(`[WebRTC] sent offer to ${targetId}`);
        })
        .catch(console.error);
    }

    peersRef.current.set(targetId, pc);
    return pc;
  }, [micStreamRef]);

  // ✅ Sync mic to peers
  useEffect(() => {
    const stream = micStreamRef.current;
    if (!stream) return;

    const track = stream.getAudioTracks()[0];
    if (!track || track.readyState !== "live") {
      console.warn("⚠️ mic track not live");
      return;
    }

    peersRef.current.forEach((pc) => {
      if (pc.connectionState === "closed") return;

      const sender = pc.getSenders().find((s) => s.track?.kind === "audio");

      if (sender) {
        console.log("🔁 replacing track with LIVE mic");
        sender.replaceTrack(track).catch(console.error);
      } else {
        console.log("➕ adding new track");
        pc.addTrack(track, stream);
      }
    });
  }, [micOn, micStreamRef]);

  // 🌐 WebSocket
  useEffect(() => {
    if (!currentUserId) return;

    const url = new URL(WS_URL);
    url.pathname = "/signal";

    const ws = new WebSocket(url.toString());
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[WebRTC] signal WS connected");
    };

    ws.onmessage = async (e) => {
      let msg: any;
      try {
        msg = JSON.parse(e.data);
      } catch {
        return;
      }

      if (msg.type === "presence") return;

      console.log(`[WebRTC] received ${msg.type} from ${msg.from}`);

      if (msg.type === "offer") {
        const pc = createPeer(msg.from, false);

        await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
        await addPendingCandidates(pc, msg.from);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        ws.send(JSON.stringify({
          type: "answer",
          target: msg.from,
          sdp: answer,
        }));
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

  // 👥 Peer management
  useEffect(() => {
    activeUserIds.forEach((uid) => {
      if (uid !== currentUserId && !peersRef.current.has(uid)) {
        const shouldInitiate = currentUserId > uid;
        createPeer(uid, shouldInitiate);
      }
    });

    peersRef.current.forEach((pc, uid) => {
      if (!activeUserIds.includes(uid)) {
        pc.close();
        peersRef.current.delete(uid);
        audioElements.current.delete(uid);
      }
    });
  }, [activeUserIds, currentUserId, createPeer]);

  // 🔊 Speaker control (EXPOSE THIS)
  const toggleSpeaker = (userId: string, enabled: boolean) => {
    const audio = audioElements.current.get(userId);
    if (audio) {
      audio.muted = !enabled;
      console.log(`🔊 ${userId}:`, enabled ? "ON" : "OFF");
    }
  };

  return { toggleSpeaker };
}