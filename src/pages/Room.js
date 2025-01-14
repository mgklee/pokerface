import React, { useEffect, useRef, useState } from "react";
import { useParams, useLocation, useRevalidator, useNavigate } from "react-router-dom";
import "./Room.css";

const RoomPage = () => {
  const { roomId } = useParams();
  const localVideoRef = useRef(null);
  const socket = useRef(null);
  const peerConnections = useRef({});
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [items, setItems] = useState([]); // 사용자 DB의 items 목록
  const [selectedFiles, setSelectedFiles] = useState([]); // 중앙 드래그 앤 드롭/업로드 목록
  const location = useLocation();
  const navigate = useNavigate();

  const maxParticipants = location.state?.participants;

  // 백엔드에서 실시간 웹캠 관리 (시작)
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
          maxParticipants: maxParticipants,
        })
      );
    };

    socket.current.onmessage = async (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case "room-full":
          alert("정원이 다 찼습니다.");
          navigate("/");
          break;
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
  // 백엔드에서 실시간 웹캠 관리 (끝)

  // 드래그앤 드롭 (시작)
  useEffect(() => {
    // 여기서 사용자 DB에서 items 목록을 불러옴 (예시 데이터)
    const mockItems = [
      { type: "text", content: "Sample Text 1" },
      { type: "text", content: "Sample Text 2" },
      { type: "image", content: "https://via.placeholder.com/150" },
    ];
    setItems(mockItems);
  }, []);

  const handleFileDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles((prev) => [...prev, ...files.map((file) => file.name)]);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles((prev) => [...prev, ...files.map((file) => file.name)]);
  };
  // 드래그앤 드롭 (끝)

  return (
    <div className="room-page">
      <div className="layout-container">
        {/* 왼쪽 비디오 영역 */}
        <div className="video-container">
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

        {/* 가운데 드래그 앤 드롭 및 업로드 영역 */}
        <div
          className="drop-area"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
        >
          <p>Drag and drop files here, or select files to upload.</p>
          <div>
            <input type="file" multiple onChange={handleFileSelect} />
          </div>
          <ul>
            {selectedFiles.map((file, index) => (
              <li key={index}>{file}</li>
            ))}
          </ul>
        </div>

        {/* 오른쪽 사용자 DB 아이템 목록 */}
        <div className="item-list">
          <h3>User Items</h3>
          <ul>
            {items.map((item, index) => (
              <li key={index}>
                {item.type === "text" ? (
                  <span>{item.content}</span>
                ) : (
                  <img src={item.content} alt="item" />
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RoomPage;
