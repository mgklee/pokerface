import React, { useState } from "react";
import './JoinRoomModal.css';

const JoinRoomModal = ({ onClose }) => {
  const [roomCode, setRoomCode] = useState("");

  const handleJoinRoom = () => {
    alert(`Joining room with code: ${roomCode}`);
    onClose(); // Close the modal after submission
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Join Room</h2>
        <input
          type="text"
          placeholder="Enter Room Code"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          className="modal-input"
        />
        <div className="modal-buttons">
          <button onClick={handleJoinRoom} className="modal-button join-button">
            Join
          </button>
          <button onClick={onClose} className="modal-button cancel-button">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinRoomModal;
