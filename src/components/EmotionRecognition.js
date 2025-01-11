import React, { useRef, useEffect, useState } from "react";
import * as faceapi from "face-api.js";

const EmotionRecognition = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [topEmotions, setTopEmotions] = useState([]);

  useEffect(() => {
    // Load face-api.js models
    const loadModels = async () => {
      const MODEL_URL = "/models"; // Ensure this path matches your public folder or model directory
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
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

  const handleVideoPlay = () => {
    if (!modelsLoaded) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    const detectEmotions = async () => {
      const displaySize = { width: video.videoWidth, height: video.videoHeight };
      faceapi.matchDimensions(canvas, displaySize);

      setInterval(async () => {
        const detections = await faceapi.detectSingleFace(
          video,
          new faceapi.TinyFaceDetectorOptions()
        ).withFaceExpressions();

        if (detections) {
          const resizedDetections = faceapi.resizeResults(detections, displaySize);

          // Clear canvas and draw detections
          canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
          faceapi.draw.drawDetections(canvas, resizedDetections);

          // Get top 3 emotions sorted by probability
          const expressions = detections.expressions;
          const sortedEmotions = Object.entries(expressions)
            .sort(([, a], [, b]) => b - a) // Sort descending by probability
            .slice(0, 3); // Take top 3 emotions
          setTopEmotions(sortedEmotions);
        } else {
          setTopEmotions([]);
        }
      }, 10);
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
      <div style={{ marginTop: "10px", fontSize: "18px", fontWeight: "bold" }}>
        {topEmotions.length > 0 ? (
          <div>
            <ul style={styles.ul}>
              {topEmotions.map(([emotion, value]) => (
                <li key={emotion} style={styles.li}>
                  {emotionTranslations[emotion] || emotion}: {(value * 100).toFixed(2)}%
                </li>
              ))}
            </ul>
          </div>
        ) : (
          "표정 인식 중..."
        )}
      </div>
    </div>
  );
};

const emotionTranslations = {
  happy: "행복",
  sad: "슬픔",
  angry: "화남",
  surprised: "놀람",
  neutral: "중립",
  disgusted: "혐오",
  fearful: "두려움",
};

const styles = {
  ul: {
    listStyleType: "none",
    padding: 0,
    display: "flex", // Align items horizontally
    gap: "15px", // Add spacing between items
    justifyContent: "center", // Center items horizontally
    margin: 0, // Remove default margin
  },
  li: {
    backgroundColor: "#f0f0f0", // Optional: Add a background
    padding: "10px 15px", // Add padding for better spacing
    borderRadius: "5px", // Rounded corners for visual appeal
  }
};

export default EmotionRecognition;
