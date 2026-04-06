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

  const createPeer = useCallback(
    (targetId: string, isInitiator: boolean) => {
      // Don't create duplicate connections
      if (peersRef.current.has(targetId)) return peersRef.current.get(targetId)!;

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });

      // Add tracks from the shared mic stream (may be null if mic is off)
      const stream = micStreamRef.current;
      if (stream) {
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
      }

      // Play incoming audio
      pc.ontrack = (e) => {
        const audio = new Audio();
        audio.srcObject = e.streams[0];
        audio.autoplay = true;
        // Keep reference so it doesn't get garbage collected
        (pc as any)._remoteAudio = audio;
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
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "disconnected"
        ) {
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

  // Mute/unmute tracks across ALL peer connections when micOn changes
  useEffect(() => {
    peersRef.current.forEach((pc) => {
      pc.getSenders().forEach((sender) => {
        if (sender.track && sender.track.kind === "audio") {
          sender.track.enabled = micOn;
        }
      });
    });
  }, [micOn]);

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
      try {
        msg = JSON.parse(e.data);
      } catch {
        return;
      }

      if (msg.type === "offer") {
        const pc = createPeer(msg.from, false);
        await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        ws.send(
          JSON.stringify({ type: "answer", target: msg.from, sdp: answer })
        );
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
          } catch {
            // Ignore stale candidates
          }
        }
      }
    };

    return () => {
      ws.close();
      peersRef.current.forEach((pc) => pc.close());
      peersRef.current.clear();
    };
  }, [currentUserId, createPeer]);

  // Create peer connections when new users appear
  useEffect(() => {
    activeUserIds.forEach((uid) => {
      if (uid !== currentUserId && !peersRef.current.has(uid)) {
        createPeer(uid, true);
      }
    });

    // Close connections for users who left
    peersRef.current.forEach((pc, uid) => {
      if (!activeUserIds.includes(uid)) {
        pc.close();
        peersRef.current.delete(uid);
      }
    });
  }, [activeUserIds, currentUserId, createPeer]);
}