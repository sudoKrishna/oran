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

  // Call this whenever mic stream becomes available
  const syncTracksToAllPeers = useCallback(() => {
    const stream = micStreamRef.current;
    if (!stream) return;

    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;

    peersRef.current.forEach((pc) => {
      const senders = pc.getSenders();
      const audioSender = senders.find((s) => s.track?.kind === "audio");

      if (audioSender) {
        // Replace existing track
        audioSender.replaceTrack(audioTrack);
      } else {
        // No sender yet — add the track fresh
        pc.addTrack(audioTrack, stream);
      }
    });
  }, [micStreamRef]);

  const createPeer = useCallback(
    (targetId: string, isInitiator: boolean) => {
      if (peersRef.current.has(targetId)) return peersRef.current.get(targetId)!;

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });

      // Add track if stream already exists
      const stream = micStreamRef.current;
      if (stream) {
        stream.getAudioTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
      }

      // Play incoming remote audio
      pc.ontrack = (e) => {
        const audio = new Audio();
        audio.srcObject = e.streams[0];
        audio.autoplay = true;
        audio.play().catch(console.error);
        (pc as any)._remoteAudio = audio; // prevent GC
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          wsRef.current?.send(
            JSON.stringify({
              type: "ice-candidate",
              target: targetId,
              candidate: e.candidate,
            })
          );
        }
      };

      pc.onconnectionstatechange = () => {
        console.log(`[WebRTC] ${targetId} →`, pc.connectionState);
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          pc.close();
          peersRef.current.delete(targetId);
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
          });
      }

      peersRef.current.set(targetId, pc);
      return pc;
    },
    [micStreamRef]
  );

  // ← KEY FIX: when micOn changes to true, push track to all peers
  useEffect(() => {
    if (micOn) {
      syncTracksToAllPeers();
    } else {
      // Mute without removing the track
      peersRef.current.forEach((pc) => {
        pc.getSenders().forEach((sender) => {
          if (sender.track?.kind === "audio") {
            sender.track.enabled = false;
          }
        });
      });
    }
  }, [micOn, syncTracksToAllPeers]);

  // WebSocket setup
  useEffect(() => {
    if (!currentUserId) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "register", userId: currentUserId }));
    };

    ws.onmessage = async (e) => {
      let msg: any;
      try { msg = JSON.parse(e.data); } catch { return; }

      if (msg.type === "offer") {
        const pc = createPeer(msg.from, false);
        await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        ws.send(JSON.stringify({ type: "answer", target: msg.from, sdp: answer }));
      }

      if (msg.type === "answer") {
        const pc = peersRef.current.get(msg.from);
        if (pc) await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
      }

      if (msg.type === "ice-candidate") {
        const pc = peersRef.current.get(msg.from);
        if (pc) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
          } catch { /* ignore stale */ }
        }
      }
    };

    return () => {
      ws.close();
      peersRef.current.forEach((pc) => pc.close());
      peersRef.current.clear();
    };
  }, [currentUserId, createPeer]);

  // Create/cleanup peers as users join or leave
  useEffect(() => {
    activeUserIds.forEach((uid) => {
      if (uid !== currentUserId && !peersRef.current.has(uid)) {
        createPeer(uid, true);
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