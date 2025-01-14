import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

const RoomPage = () => {
  const { roomId } = useParams();
  const localVideoRef = useRef(null);
  const socket = useRef(null);
  const peerConnections = useRef({});
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]);

  useEffect(() => {
    const initializeLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error initializing local stream:", err);
      }
    };

    initializeLocalStream();
  }, []);

  useEffect(() => {
    if (!localStream) return;

    socket.current = new WebSocket("wss://172.10.7.34:5001");

    socket.current.onopen = () => {
      console.log("WebSocket connected");
      const userId = Math.random().toString(36).substring(7);
      socket.current.userId = userId;

      socket.current.send(
        JSON.stringify({
          type: "join-room",
          roomId,
          userId,
        })
      );
    };

    socket.current.onmessage = async (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case "new-user":
          await handleNewUser(message.userId);
          break;
        case "offer":
          await handleOffer(message.offer, message.sender);
          break;
        case "answer":
          await handleAnswer(message.answer, message.sender);
          break;
        case "ice-candidate":
          await handleIceCandidate(message.candidate, message.sender);
          break;
        case "user-left":
          handleUserLeft(message.userId);
          break;
        default:
          console.log("Unknown message type:", message.type);
      }
    };

    socket.current.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      socket.current?.close();
      Object.values(peerConnections.current).forEach((pc) => pc.close());
    };
  }, [localStream]);

  const createPeerConnection = (userId) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.current.send(
          JSON.stringify({
            type: "ice-candidate",
            candidate: event.candidate,
            target: userId,
          })
        );
      }
    };

    pc.ontrack = (event) => {
      const remoteStream = new MediaStream();
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });

      setRemoteStreams((prev) => {
        // userId가 중복되지 않도록 필터링
        const updatedStreams = prev.filter((streamObj) => streamObj.userId !== userId);
        return [...updatedStreams, { userId, stream: remoteStream }];
      });
    };

    peerConnections.current[userId] = pc;
    return pc;
  };

  const handleNewUser = async (userId) => {
    const pc = createPeerConnection(userId);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.current.send(
      JSON.stringify({
        type: "offer",
        offer,
        target: userId,
        sender: socket.current.userId,
      })
    );
  };

  const handleOffer = async (offer, sender) => {
    const pc = createPeerConnection(sender);

    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.current.send(
      JSON.stringify({
        type: "answer",
        answer,
        target: sender,
      })
    );
  };

  const handleAnswer = async (answer, sender) => {
    const pc = peerConnections.current[sender];
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    }
  };

  const handleIceCandidate = async (candidate, sender) => {
    const pc = peerConnections.current[sender];
    if (pc) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  };

  const handleUserLeft = (userId) => {
    const pc = peerConnections.current[userId];
    if (pc) {
      pc.close();
      delete peerConnections.current[userId];
    }

    setRemoteStreams((prev) => prev.filter((streamObj) => streamObj.userId !== userId));
  };

  return (
    <div className="room-page">
      <h1>Room {roomId}</h1>
      <video ref={localVideoRef} autoPlay muted></video>
      <div id="remote-videos">
        {remoteStreams.map(({ userId, stream }) => (
          <video
            key={userId}
            autoPlay
            ref={(video) => {
              if (video) {
                video.srcObject = stream;
              }
            }}
          ></video>
        ))}
      </div>
    </div>
  );
};

export default RoomPage;
