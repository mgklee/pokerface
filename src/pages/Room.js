import React, { useEffect, useRef, useState } from "react";
import { useParams, useLocation, useRevalidator, useNavigate } from "react-router-dom";
import * as faceapi from "face-api.js";
import EmotionChart from "../components/EmotionChart.js";
import "./Room.css";
import { PiTreeViewDuotone } from "react-icons/pi";

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

  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [items, setItems] = useState([]); // 사용자 DB의 items 목록
  const [selectedFiles, setSelectedFiles] = useState([]); // 중앙 드래그 앤 드롭/업로드 목록
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


  const maxParticipants = location.state?.participants;

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
  useEffect(() => {
    // 여기서 사용자 DB에서 items 목록을 불러옴 (예시 데이터)
    const mockItems = [
      { type: "text", content: "Sample Text 1" },
      { type: "text", content: "Sample Text 2" },
      // { type: "image", content: "https://via.placeholder.com/150" },
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

  const handleVideoPlay = (video, canvas, userId) => {
    if (!modelsLoaded) return;

    const detectEmotions = async () => {
      const displaySize = { width: video.videoWidth, height: video.videoHeight };
      faceapi.matchDimensions(canvas, displaySize);

      setInterval(async () => {
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
              console.log('ang');
              if(!prevDatabase[userId]) {
                prevDatabase[userId] = {
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
              }

              const prevData = prevDatabase[userId];
              console.log(prevData);
              const { userId, ...updatedDatabase } = prevDatabase;

              return {
                ...updatedDatabase,
                userId: {
                  timestamps: [...prevData.timestamps, currentTime].slice(-20),
                  emotions: Object.keys(prevData.emotions).reduce((acc, emotion) => {
                    acc[emotion] = [...prevData.emotions[emotion], expressions[emotion] || 0].slice(-20);
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
      }, 100);
    };

    detectEmotions();
  };

  const handleLoadedMetadata = (_videoRef, _canvasRef, userId) => {
    const video = _videoRef.current;
    const canvas = _canvasRef.current;

    if (video && canvas) {
      canvas.width = video.width;
      canvas.height = video.height;
      handleVideoPlay(video, canvas, userId);
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
          <div id="remote-videos">
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
                    {/* <EmotionChart chartData={chartDatabase[userId]} /> */}
                  </div>
                </div>
              );
            })}
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
