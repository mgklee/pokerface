import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const RoomPage = () => {
  const { roomId } = useParams();
  const [videos, setVideos] = useState([]);
  const [streams, setStreams] = useState([]);

  useEffect(() => {
    // Simulate webcam videos for the number of participants
    const participantCount = parseInt(roomId, 10);
    const videoStreams = Array.from({ length: participantCount }, (_, index) => ({
      id: index + 1,
      name: `Participant ${index + 1}`,
    }));
    setVideos(videoStreams);

    // Start videos for each participant
    const newStreams = [];
    videoStreams.forEach(async (video) => {
      const stream = await startVideo(video.id);
      if (stream) newStreams.push(stream);
    });
    setStreams(newStreams);

    return () => {
      // Stop all streams when component unmounts
      newStreams.forEach((stream) => {
        stream.getTracks().forEach((track) => track.stop());
      });
    };
  }, [roomId]);

  const startVideo = async (id) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const videoElement = document.getElementById(`video-${id}`);
      if (videoElement) {
        videoElement.srcObject = stream;
        videoElement.onloadedmetadata = () => {
          videoElement.play();
        };
      }
      return stream;
    } catch (error) {
      console.error(`Error starting video for participant ${id}:`, error);
      return null;
    }
  };

  const getGridStyle = () => {
    const count = videos.length;
    if (count === 1) return { gridTemplateColumns: "1fr" };
    if (count === 2) return { gridTemplateColumns: "1fr 1fr" };
    if (count <= 4) return { gridTemplateColumns: "1fr 1fr" };
    return { gridTemplateColumns: "1fr 1fr 1fr" }; // Adjust for larger counts
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Room {roomId}</h1>
      <div style={{ ...styles.videoGrid, ...getGridStyle() }}>
        {videos.map((video) => (
          <div key={video.id} style={styles.videoCard}>
            <video
              id={`video-${video.id}`}
              style={styles.video}
              autoPlay
              playsInline
            ></video>
            <p style={styles.participantName}>{video.name}</p>
          </div>
        ))}
      </div>
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
