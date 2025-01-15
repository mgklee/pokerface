import React, { useEffect, useRef, useState } from "react";
import { FaCopy } from "react-icons/fa";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import * as faceapi from "face-api.js";
import EmotionChart from "../components/EmotionChart.js";
import "./Room.css";

const RoomPage = () => {
  const { roomId } = useParams();
  const localVideoRef = useRef(null);
  const localCanvasRef = useRef(null);
  const videoRefs = useRef({});
  const canvasRefs = useRef({});
  const socket = useRef(null);
  const peerConnections = useRef({});
  const location = useLocation();
  const navigate = useNavigate();
  const baseUrl = "https://172.10.7.34:5001";

  const [items, setItems] = useState([]); // 사용자 DB의 items 목록
  const [uploadedItem, setUploadedItem] = useState(null); // 업로드된 항목
  const [sharedItem, setSharedItem] = useState(null); // 공유된 항목
  const [attackItem, setAttackItem] = useState({ type: "text", content: "" }); // 공격할 항목
  const [selectedFiles, setSelectedFiles] = useState([]); // 중앙 드래그 앤 드롭/업로드 목록
  const [currentTurnUser, setCurrentTurnUser] = useState(0);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [chartDatabase, setChartDatabase] = useState({});
  const [chartData, setChartData] = useState({
    timestamps: [],
    emotions: {
      happy: [],
      sad: [],
      angry: [],
      surprised: [],
      neutral: [],
      disgusted: [],
      fearful: [],
    },
  });

  // useEffect(() => {
  //   if (!location.state) {
  //     alert("올바르지 않은 접근입니다.");
  //     navigate("/");
  //   }
  // }, [location.state, navigate]);

  const maxParticipants = location.state?.participants;
  const userId = location.state?.userId;
  const localUserId = userId ? userId : Math.random().toString(36).substring(7);

  useEffect(() => {
    const fetchItems = async () => {
      const response = await fetch(`${baseUrl}/users/${localUserId}/items`);
      const data = await response.json();
      setItems(data);
    };

    fetchItems();
  }, [localUserId]);

  // 백엔드에서 실시간 웹캠 관리 (시작)
  useEffect(() => {
    const constraints = {
      video: {
        width: { ideal: 360 },
        height: { ideal: 270 },
      },
    };

    const initializeLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
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
      console.log("Resolved userId:", localUserId); // userId 로그 확인
      socket.current.userId = localUserId;

      if (socket.current.readyState === WebSocket.OPEN) {
        socket.current.send(
          JSON.stringify({
            type: "join-room",
            roomId,
            userId: localUserId,
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

  useEffect(() => {
    // Load face-api.js models
    const loadModels = async () => {
      try {
        const MODEL_URL = "/models"; // Path to your models
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch (error) {
        console.error("Error loading models: ", error);
      }
    };

    loadModels();
  }, []);

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
      }, uploadedItem?.type === "video" ? 60000 : 10000);
    } else {
      alert("공격할 항목이 없습니다.");
    }
  };
  // 드래그앤 드롭 (끝)

  const detectEmotions = (video, canvas, userId) => {
    const displaySize = { width: video.videoWidth, height: video.videoHeight };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
      if (video.paused || video.ended) return;
      const detections = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      if (detections) {
        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);

        const expressions = detections.expressions;
        const currentTime = new Date().toLocaleTimeString();

        if (userId) {
          setChartDatabase((prevDatabase) => {
            const existingUserData = prevDatabase[userId] || {
              timestamps: [],
              emotions: {
                happy: [],
                sad: [],
                angry: [],
                surprised: [],
                neutral: [],
                disgusted: [],
                fearful: [],
              },
            };

            return {
              ...prevDatabase,
              [userId]: {
                timestamps: [...existingUserData.timestamps, currentTime].slice(-20),
                emotions: Object.keys(existingUserData.emotions).reduce((acc, emotion) => {
                  acc[emotion] = [...existingUserData.emotions[emotion], expressions[emotion] || 0].slice(-20);
                  return acc;
                }, {}),
              }
            };
          });
        } else {
          setChartData((prevData) => ({
            timestamps: [...prevData.timestamps, currentTime].slice(-20),
            emotions: Object.keys(prevData.emotions).reduce((acc, emotion) => {
              acc[emotion] = [...prevData.emotions[emotion], expressions[emotion] || 0].slice(-20);
              return acc;
            }, {}),
          }));
        }
      }
    }, 500);
  };

  const handleLoadedMetadata = (_videoRef, _canvasRef, userId) => {
    const video = _videoRef.current;
    const canvas = _canvasRef.current;

    if (video && canvas && modelsLoaded && !video.dataset.detectionRunning) {
      canvas.width = video.width;
      canvas.height = video.height;
      video.dataset.detectionRunning = "true";
      detectEmotions(video, canvas, userId);
    }
  };

  const renderItemContent = (item) => {
    switch (item.type) {
      case "image":
        return <img src={item.content} alt="Item" className="item-image" />;
      case "video":
        // Extract video ID from YouTube URLs (regular and Shorts)
        let videoId = null;
        let startTime = null;

        if (item.content.includes("youtube.com/watch")) {
          // Regular YouTube video URL
          videoId = item.content.split("v=")[1]?.split("&")[0]; // Extract video ID
          startTime = item.content.split("t=")[1];
        } else if (item.content.includes("youtube.com/shorts")) {
          // YouTube Shorts URL
          videoId = item.content.split("/shorts/")[1]?.split("?")[0];
        }

        const embedUrl = videoId
          ? `https://www.youtube.com/embed/${videoId}${startTime ? `?start=${startTime}` : ""}`
          : null;

        if (!embedUrl) {
          return <p>유효하지 않은 YouTube 링크입니다.</p>; // Show error for invalid links
        }

        return (
          <iframe
            width="100%"
            height="315"
            src={embedUrl}
            title="YouTube video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        );
      default:
        return <p>{item.content}</p>;
    }
  };

  return (
    <div className="room-page">
      <div className="layout-container">
        {/* 왼쪽 비디오 영역 */}
        <div className="video-container">
          <div className="video-item">
            <div style={{ position: "relative" }}>
              <video
                ref={localVideoRef}
                autoPlay
                muted
                onLoadedMetadata={() => handleLoadedMetadata(localVideoRef, localCanvasRef, null)}
              />
              <canvas
                ref={localCanvasRef}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                }}
              />
            </div>
            <EmotionChart chartData={chartData} height={270} />
          </div>
          {remoteStreams.map(({ userId, stream }) => {
            if (!videoRefs.current[userId]) {
              videoRefs.current[userId] = React.createRef();
            }

            if (!canvasRefs.current[userId]) {
              canvasRefs.current[userId] = React.createRef();
            }

            return (
              <div key={userId} className="video-item">
                <div style={{ position: "relative" }}>
                  <video
                    ref={(video) => {
                      if (video) {
                        video.srcObject = stream;
                        videoRefs.current[userId].current = video;
                      }
                    }}
                    autoPlay
                    muted
                    onLoadedMetadata={() => handleLoadedMetadata(videoRefs.current[userId], canvasRefs.current[userId], userId)}
                  />
                  <canvas
                    ref={(canvas) => {
                      if (canvas) {
                        canvasRefs.current[userId].current = canvas;
                      }
                    }}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                    }}
                  />
                </div>
                <EmotionChart
                  chartData={chartDatabase[userId]}
                  height={270}
                />
              </div>
            );
          })}
        </div>

        {/* 가운데 드래그 앤 드롭 및 업로드 영역 */}
        <div
          className="drop-area"
          onDragOver={(e) => e.preventDefault()}
          onDrop={currentTurnUser === socket.current?.userId ? handleFileDrop : (e) => e.preventDefault()}
        >
          {sharedItem ? (
            <ul>
              {renderItemContent(sharedItem)}
            </ul>
          ) : (
            currentTurnUser === socket.current?.userId ? (
              <>
                <p>파일을 드래그 앤 드롭하거나,<br/>업로드할 파일을 선택하세요.</p>
                <input type="file" onChange={handleFileSelect} />
                <form
                  className="add-item"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await setUploadedItem(attackItem);
                    setAttackItem({type: "text", content: ""});
                  }}
                >
                  <select
                    value={attackItem.type}
                    onChange={(e) => setAttackItem((prev) => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="text">텍스트</option>
                    <option value="image">이미지</option>
                    <option value="video">비디오</option>
                  </select>
                  <input
                    type="text"
                    placeholder={
                      attackItem.type === "text"
                        ? "새 아이템을 입력하세요"
                        : attackItem.type === "image"
                        ? "이미지 URL을 입력하세요"
                        : "유튜브 링크를 입력하세요"
                    }
                    value={attackItem.content}
                    onChange={(e) => setAttackItem({ ...attackItem, content: e.target.value })}
                  />
                </form>
                <button onClick={handleDropZoneClick}>공격!!</button>
              </>
            ) : (
              <p>다른 유저가 아이템을 고르고 있어요...</p>
            )
          )}
        </div>

        {/* 오른쪽 사용자 DB 아이템 목록 */}
        <div className="item-list">
          <h3>내 아이템 목록</h3>
          <ul>
            {items?.map((item, index) => (
              <li key={index}>
                <div style={{ display: "flex" }}>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(item.content)
                        .then(() => alert("복사되었습니다!"))
                        .catch((err) => alert("복사에 실패했습니다."));
                    }}
                  >
                    <FaCopy />
                  </button>
                  {renderItemContent(item)}
                </div>
              </li>
            ))}
          </ul>
          </div>
      </div>
    </div>
  );
};

export default RoomPage;
