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
    socket.current = new WebSocket("ws://172.10.7.34:8080");

    // WebSocket 연결 상태 확인
    socket.current.onopen = () => {
      console.log("WebSocket connected!");
      isSocketConnected.current = true;
      // WebRTC 연결 시작 (WebSocket이 열렸을 때)
      peerConnection.current.createOffer().then((offer) => {
        peerConnection.current.setLocalDescription(offer);
        if (socket.current.readyState === WebSocket.OPEN) {
          socket.current.send(JSON.stringify({ type: "offer", offer }));
        } else {
          console.error("WebSocket is not open. Unable to send message.");
        }
      });
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
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // WebSocket 메시지 처리
    socket.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "offer") {
        peerConnection.current
          .setRemoteDescription(new RTCSessionDescription(message.offer))
          .then(() => peerConnection.current.createAnswer())
          .then((answer) => {
            peerConnection.current.setLocalDescription(answer);
            socket.current.send(JSON.stringify({ type: "answer", answer }));
          });
      } else if (message.type === "answer") {
        peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(message.answer)
        );
      } else if (message.type === "ice-candidate") {
        peerConnection.current.addIceCandidate(
          new RTCIceCandidate(message.candidate)
        );
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
