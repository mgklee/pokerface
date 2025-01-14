import React, { useRef, useEffect, useState } from "react";
import * as faceapi from "face-api.js";
import EmotionChart from "./EmotionChart.js";

const EmotionRecognition = ({ currentMission, missionProgress, setMissionProgress, setMissionCompleted }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const currentMissionRef = useRef(currentMission);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [blinks, setBlinks] = useState(0);
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

  useEffect(() => {
    // Keep the ref updated with the latest currentMission
    currentMissionRef.current = currentMission;
  }, [currentMission]);

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

  useEffect(() => {
    const constraints = {
      video: {
        width: { ideal: 480 },
        height: { ideal: 360 },
      },
    };

    // Start webcam video
    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing webcam: ", err);
      }
    };

    startVideo();
  }, []);

  const handleMissionProgress = (expressions) => {
    const mission = currentMissionRef.current; // Use the latest currentMission
    if (!mission) return;

    const score = expressions[mission.emotion] || 0;

    if (mission.type === "keep") {
      if (score >= mission.target) {
        setMissionProgress((prev) => {
          const newProgress = prev + 0.1; // Increment progress
          if (newProgress >= mission.duration) {
            setMissionCompleted(true); // Mark mission as complete
          }
          return newProgress;
        });
      } else {
        setMissionProgress(0); // Reset progress if the condition breaks
      }
    } else if (mission.type === "limit") {
      if (score >= 0.1 && score <= 0.9) {
        setMissionProgress((prev) => {
          const newProgress = prev + 0.1; // Increment progress
          if (newProgress >= mission.duration) {
            setMissionCompleted(true); // Mark mission as complete
          }
          return newProgress;
        });
      } else {
        setMissionProgress(0); // Reset progress if the condition breaks
      }
    } else {
      if (score >= missionProgress) {
        setMissionProgress(score);
      }
      if (score >= mission.target) {
        setMissionCompleted(true);
      }
    }
  };

  const handleVideoPlay = () => {
    if (!modelsLoaded) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

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

          setChartData((prevData) => ({
            timestamps: [...prevData.timestamps, currentTime].slice(-20),
            emotions: Object.keys(prevData.emotions).reduce((acc, emotion) => {
              acc[emotion] = [...prevData.emotions[emotion], expressions[emotion] || 0].slice(-20);
              return acc;
            }, {}),
          }));

          handleMissionProgress(expressions);
        }
      }, 100);
    };

    detectEmotions();
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas) {
      canvas.width = video.width;
      canvas.height = video.height;
      handleVideoPlay();
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: "40px"
    }}>
      <div style={{ position: "relative", textAlign: "center" }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          onLoadedMetadata={handleLoadedMetadata}
          style={{ border: "1px solid black" }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
          }}
        />
      </div>
      <div style={{ height: 360 }}>
        <h3>Total Blinks: {blinks}</h3>
        <EmotionChart chartData={chartData} />
      </div>
    </div>
  );
};

export default EmotionRecognition;
