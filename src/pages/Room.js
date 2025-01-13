import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

const RoomPage = () => {
  const { roomId } = useParams();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const socket = useRef(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const connectedUserId = useRef(null);

  useEffect(() => {
    // WebSocket 연결
    socket.current = new WebSocket("wss://172.10.7.34:5001");

    socket.current.onopen = () => {
      console.log("WebSocket connected!");
      // 방 참여 메시지 보내기
      socket.current.send(
        JSON.stringify({
          type: "join-room",
          roomId,
          userId: Math.random().toString(36).substring(7),
        })
      );
    };

    socket.current.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      console.log("Received message:", message);

      switch (message.type) {
        case "new-user":
          // 방에 새 사용자가 들어오면 Offer 생성
          await handleNewUser(message.userId);
          break;

        // case "existing-users":
        //   // 기존 사용자 목록을 받을 때 처리
        //   message.users.forEach(async (userId) => {
        //     await handleNewUser(userId);
        //   });
        //   break;

        case "offer":
          await handleOffer(message.offer, message.sender);
          break;

        case "answer":
          await handleAnswer(message.answer);
          break;

        case "ice-candidate":
          if (message.candidate) {
            await peerConnection.current.addIceCandidate(
              new RTCIceCandidate(message.candidate)
            ).catch((err) => console.error("Error adding ICE candidate:", err));
          }
          break;

        // case "user-left":
        //   // 다른 사용자가 방에서 나갔을 때 처리
        //   handleUserLeft(message.userId);
        //   break;

        default:
          console.log("Unknown message type:", message.type);
      }
    };

    // WebRTC PeerConnection 초기화
    initializePeerConnection();

    // Cleanup
    return () => {
      if (socket.current) socket.current.close();
      if (peerConnection.current) peerConnection.current.close();
    };
  }, []);

  const initializePeerConnection = () => {
    peerConnection.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    // 로컬 비디오 트랙 추가
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        stream.getTracks().forEach((track) =>
          peerConnection.current.addTrack(track, stream)
        );
      })
      .catch((err) => console.error("Error accessing media devices:", err));

    // 원격 스트림 설정
    const remoteStream = new MediaStream();
    setRemoteStream(remoteStream);
    peerConnection.current.ontrack = (event) => {
      remoteStream.addTrack(event.track);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
    };

    // ICE Candidate 생성 시 WebSocket으로 전송
    peerConnection.current.onicecandidate = (event) => {
    console.log("Generated ICE candidate:", event.candidate);
      if (event.candidate) {
        socket.current.send(
          JSON.stringify({
            type: "ice-candidate",
            candidate: event.candidate,
            target: connectedUserId.current,
          })
        );
      } else {
        console.log("End of ICE candidates.");
      }
    };
  };

  const handleOffer = async (offer, sender) => {
    console.log("Received offer from:", sender);
    if (peerConnection.current.signalingState === "stable") {
    connectedUserId.current = sender;
    console.log("Current connectedUserId:", connectedUserId);
    await peerConnection.current.setRemoteDescription(
      new RTCSessionDescription(offer)
    );
    
    const answer = await peerConnection.current.createAnswer();
    await peerConnection.current.setLocalDescription(answer);

    socket.current.send(
      JSON.stringify({
        type: "answer",
        answer,
        target: sender,
      })
    );
  } else {
    console.error("Cannot handle offer in state:", peerConnection.current.signalingState);
  }
  };

  const handleAnswer = async (answer) => {
    console.log("Received answer");
    await peerConnection.current.setRemoteDescription(
      new RTCSessionDescription(answer)
    );
  };

  const handleNewUser = async (userId) => {
    console.log("New user joined:", userId);
    connectedUserId.current = userId;
    console.log("Current connectedUserId:", connectedUserId.current);
    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);

    socket.current.send(
      JSON.stringify({
        type: "offer",
        offer,
        target: userId,
      })
    );
  };

  // const handleUserLeft = (userId) => {
  //   console.log(`User ${userId} left the room`);
  //   if (peerConnection.current[userId]) {
  //     peerConnection.current[userId].close();
  //     delete peerConnection.current[userId];
  //   }
  
  //   setRemoteStream((prevStreams) =>
  //     prevStreams.filter((stream) => stream.userId !== userId)
  //   );
  // };

  

  return (
    <div className="room-page">
      <h1>Welcome to Room {roomId}</h1>
      <video ref={localVideoRef} autoPlay muted></video>
      <video ref={remoteVideoRef} autoPlay></video>
    </div>
  );
};

export default RoomPage;
