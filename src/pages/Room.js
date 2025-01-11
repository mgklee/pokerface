import React from "react";
import { useParams } from "react-router-dom";

const RoomPage = () => {
  const { roomId } = useParams();

  return (
    <div className="room-page">
      <h1>Welcome to Room {roomId}</h1>
      <p>Number of participants: {roomId}</p>
    </div>
  );
};

export default RoomPage;
