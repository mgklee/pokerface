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
  const [items, setItems] = useState([]);
  const [uploadedItem, setUploadedItem] = useState(null); // 업로드된 항목
  const [sharedItem, setSharedItem] = useState(null); // 공유된 항목
  const [currentTurnUser, setCurrentTurnUser] = useState(0);

  const location = useLocation();
  const navigate = useNavigate();

  const maxParticipants = location.state?.participants;
  const userId = location.state?.userId;
  const loggineduserId = userId ? userId : Math.random().toString(36).substring(7);

  useEffect(() => {
    const fetchUserItems = async () => {
      try {
        const response = await fetch(`https://172.10.7.34:5001/auth/user-items/${loggineduserId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
  
        if (response.ok) {
          const data = await response.json();
          setItems(data.items); // 사용자 아이템 설정
        } else {
          console.error("Failed to fetch items:", response.statusText);
        }
      } catch (err) {
        console.error("Error fetching user items:", err);
      }
    };
  
    fetchUserItems();
  }, [loggineduserId]);

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

    socket.current.onopen = async () => {
      console.log("WebSocket connected");
      console.log("Resolved userId:", loggineduserId); // userId 로그 확인
      socket.current.userId = loggineduserId;

      if (socket.current.readyState === WebSocket.OPEN) {
        socket.current.send(
          JSON.stringify({
            type: "join-room",
            roomId,
            userId: loggineduserId,
            maxParticipants: maxParticipants,
          })
        );
      }
    };

    socket.current.onmessage = async (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case "turn-update":
          setCurrentTurnUser(message.currentTurn);
          break;
        case "shared-item":
          setSharedItem(message.item);
          const remainingTime = message.expireTime - Date.now();
          if (remainingTime > 0) {
            setTimeout(() => {
              setSharedItem(null);
            }, remainingTime);
          } else {
            setSharedItem(null); // 이미 시간이 지났다면 바로 제거
          }
          break;
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
  // useEffect(() => {
  //   // 여기서 사용자 DB에서 items 목록을 불러옴 (예시 데이터)
  //   const mockItems = [
  //     { type: "text", content: "논리적인 사람이 총을 쏘면? 타당타당" },
  //     { type: "text", content: "Sample Text 2" },
  //     { type: "image", content: "https://www.youtube.com" },
  //   ];
  //   setItems(mockItems);
  // }, []);

  // 공통 파일 처리 함수
const processFile = (file) => {
  if (file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedItem({ type: "image", content: reader.result });
    };
    reader.readAsDataURL(file);
  } else if (file.type === "text/plain") {
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedItem({ type: "text", content: reader.result });
    };
    reader.readAsText(file); // 텍스트 파일 읽기
  } else {
    alert("이미지 파일이나 텍스트 파일만 업로드 가능합니다.");
  }
};

// 드래그 앤 드롭 처리 함수
const handleFileDrop = (e) => {
  e.preventDefault();
  
  // 업로드 제한 확인
  const items = e.dataTransfer?.items;
  // if (!items || items.length > 1 || uploadedItem) {
  //   alert("하나의 항목만 업로드할 수 있습니다.");
  //   return;
  // }

  const item = items[0];
  if (item.kind === "file") {
    const file = item.getAsFile();
    processFile(file); // 파일 처리
  } else if (item.kind === "string" && item.type === "text/plain") {
    item.getAsString((text) => {
      setUploadedItem({ type: "text", content: text });
    });
  } else {
    alert("이미지나 텍스트만 지원됩니다.");
  }
};

// 파일 선택기 처리 함수
const handleFileSelect = (e) => {
  // 업로드 제한 확인
  const files = e.target?.files;
  // if (!files || files.length > 1 || uploadedItem) {
  //   alert("하나의 항목만 업로드할 수 있습니다.");
  //   return;
  // }

  const file = files[0];
  processFile(file); // 파일 처리
};

  const handleDropZoneClick = () => {
    if (!socket.current || socket.current.readyState !== WebSocket.OPEN) {
      console.error("WebSocket is not open. Cannot send data.");
      return;
    }
    if (uploadedItem) {
      socket.current.send(
        JSON.stringify({
          type: "shared-item",
          item: uploadedItem,
        })
      );
      setSharedItem(uploadedItem);
      setUploadedItem(null); // 업로드된 항목 초기화
      setTimeout(() => {
        socket.current.send(
          JSON.stringify({ type: "end-turn" })
        );
        setSharedItem(null);
      }, 10000);
    } else {
      alert("공유할 항목이 없습니다.");
    }
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
          onDrop={currentTurnUser === socket.current?.userId ? handleFileDrop : (e) => e.preventDefault()}
        >
          {currentTurnUser === socket.current?.userId ? (
            <>
              <p>Drag and drop files here, or select files to upload.</p>
              <div>
                <input type="file" onChange={handleFileSelect} />
              </div>
              <button onClick={handleDropZoneClick}>확인</button>
            </>
          ) : (
            <p>다른 사용자의 턴입니다. 기다려주세요.</p>
          )}
          {sharedItem && (
            <ul>
              {sharedItem.type === "image" ? (
                <img src={sharedItem.content} alt="Shared item" style={{ width: "100px" }} />
              ) : (
                <p>{sharedItem.content}</p>
              )}
            </ul>
          )}
        </div>

        {/* 오른쪽 사용자 DB 아이템 목록 */}
        <div className="item-list">
          <h3>User Items</h3>
          <ul>
            {items?.map((item, index) => (
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
