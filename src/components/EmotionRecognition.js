import React, { useRef, useEffect, useState } from "react";
import * as faceapi from "face-api.js";
import { Line } from "react-chartjs-2";
import {
  Chart,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register necessary components for Chart.js
Chart.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend);

const EmotionRecognition = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [blinks, setBlinks] = useState(0); // Counter for blinks
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

  const calculateEAR = (eye) => {
    const vertical1 = Math.hypot(eye[1].x - eye[5].x, eye[1].y - eye[5].y);
    const vertical2 = Math.hypot(eye[2].x - eye[4].x, eye[2].y - eye[4].y);
    const horizontal = Math.hypot(eye[0].x - eye[3].x, eye[0].y - eye[3].y);
    return (vertical1 + vertical2) / (2.0 * horizontal);
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

          // Clear canvas and draw detections
          canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
          faceapi.draw.drawDetections(canvas, resizedDetections);

          // Update chart data
          const expressions = detections.expressions;
          const currentTime = new Date().toLocaleTimeString();

          setChartData((prevData) => ({
            timestamps: [...prevData.timestamps, currentTime].slice(-20), // Keep last 20 timestamps
            emotions: Object.keys(prevData.emotions).reduce((acc, emotion) => {
              acc[emotion] = [...prevData.emotions[emotion], expressions[emotion] || 0].slice(-20);
              return acc;
            }, {}),
          }));

          // Blink detection
          const landmarks = detections.landmarks;
          const leftEye = landmarks.getLeftEye();
          const rightEye = landmarks.getRightEye();

          const leftEAR = calculateEAR(leftEye);
          const rightEAR = calculateEAR(rightEye);
          const ear = (leftEAR + rightEAR) / 2.0;

          if (ear < 0.25) {
            setBlinks((prev) => prev + 1);
          }
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
    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
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
      <div>
        <h3>Total Blinks: {blinks}</h3>
        <EmotionLineChart chartData={chartData} />
      </div>
    </div>
  );
};

const EmotionLineChart = ({ chartData }) => {
  const data = {
    labels: chartData.timestamps, // Time labels
    datasets: Object.keys(chartData.emotions).map((emotion, index) => ({
      label: emotion,
      data: chartData.emotions[emotion],
      borderColor: `rgba(${50 + index * 30}, ${100 + index * 20}, ${200 - index * 20}, 1)`,
      backgroundColor: `rgba(${50 + index * 30}, ${100 + index * 20}, ${200 - index * 20}, 0.2)`,
      fill: false, // No fill under the line
      tension: 0.4, // Smooth lines
    })),
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
    },
    scales: {
      x: {
        type: "category", // Use "category" scale for x-axis
        title: {
          display: true,
          text: "Time",
        },
      },
      y: {
        title: {
          display: true,
          text: "Probability",
        },
        beginAtZero: true,
        max: 1, // Probabilities range from 0 to 1
      },
    },
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <Line data={data} options={options} />
    </div>
  );
};

export default EmotionRecognition;
