import React, {useEffect, useRef} from "react";
import { useParams } from "react-router-dom";

const RoomPage = () => {
  const { roomId } = useParams();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const socket = useRef(null);
  const isSocketConnected = useRef(false);

  useEffect(() => {
    // WebSocket 연결
    socket.current = new WebSocket("wss://172.10.7.34:5001");

    // WebSocket 연결 상태 확인
    socket.current.onopen = () => {
      console.log("WebSocket connected!");
      isSocketConnected.current = true;
      // 본인의 방 번호와 ID를 서버에 전달
      socket.current.send(
        JSON.stringify({ type: "join-room", roomId, userId: Math.random().toString(36).substring(7) })
      );
    };

    socket.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    // RTCPeerConnection 초기화
    peerConnection.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    // 로컬 비디오 스트림 설정
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        stream.getTracks().forEach((track) => {
          peerConnection.current.addTrack(track, stream);
        });
      })
      .catch((error) => console.error("Error accessing media devices:", error));

    // ICE 후보자 교환
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.current.send(
          JSON.stringify({ type: "ice-candidate", candidate: event.candidate })
        );
      }
    };

    // 원격 스트림 설정
    peerConnection.current.ontrack = (event) => {
      const videoElement = document.createElement("video");
      videoElement.autoplay = true;
      videoElement.srcObject = event.streams[0];
      videoElement.style.border = "1px solid black";
      videoElement.style.margin = "10px";

      // "remote-videos"라는 컨테이너에 추가
      const remoteVideosContainer = document.getElementById("remote-videos");
      if (remoteVideosContainer) {
        remoteVideosContainer.appendChild(videoElement);
      }
    };

    // WebSocket 메시지 처리
    socket.current.onmessage = async(event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case "new-user":
          console.log("New user joined:", message.userId);

          // 새 사용자와 연결 시작
          const offer = await peerConnection.current.createOffer();
          await peerConnection.current.setLocalDescription(offer);

          socket.current.send(
            JSON.stringify({
              type: "offer",
              offer,
              target: message.userId,
            })
          );
          break;

        case "offer":
          console.log("Received offer from:", message.sender);
          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(message.offer)
          );

          const answer = await peerConnection.current.createAnswer();
          await peerConnection.current.setLocalDescription(answer);

          socket.current.send(
            JSON.stringify({
              type: "answer",
              answer,
              target: message.sender,
            })
          );
          break;

        case "answer":
          console.log("Received answer from:", message.sender);
          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(message.answer)
          );
          break;

        case "ice-candidate":
          if (message.candidate) {
            console.log("Received ICE candidate:", message.candidate);
            await peerConnection.current.addIceCandidate(
              new RTCIceCandidate(message.candidate)
            );
          }
          break;

        default:
          console.log("Unknown message type:", message.type);
      }
    };

    // Cleanup: WebSocket과 PeerConnection 정리
    return () => {
      if (socket.current) socket.current.close();
      if (peerConnection.current) peerConnection.current.close();
    };
  }, []);


  return (
    <div className="room-page">
      <h1>Welcome to Room {roomId}</h1>
      <p>Number of participants: {roomId}</p>
      <video ref = {localVideoRef} autoPlay muted></video>
      <video ref = {remoteVideoRef} autoPlay></video>
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    textAlign: "center",
    backgroundColor: "#f5f5f5",
    minHeight: "100vh",
  },
  title: {
    fontSize: "2rem",
    marginBottom: "20px",
    color: "#333",
  },
  videoGrid: {
    display: "grid",
    gap: "20px",
    justifyContent: "center",
    padding: "20px",
  },
  videoCard: {
    backgroundColor: "white",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
    borderRadius: "10px",
    overflow: "hidden",
    textAlign: "center",
  },
  video: {
    backgroundColor: "#000",
    height: "200px",
    width: "100%",
  },
  participantName: {
    marginTop: "10px",
    fontSize: "1rem",
    color: "#333",
  },
};

export default RoomPage;
