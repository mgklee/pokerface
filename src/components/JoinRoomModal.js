import React, { useState } from "react";
import "./JoinRoomModal.css";

const JoinRoomModal = ({ onClose }) => {
  const [roomCode, setRoomCode] = useState("");

  const handleJoinRoom = () => {
    alert(`Joining room with code: ${roomCode}`);
    onClose(); // Close the modal after submission
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>참가하기</h2>
        <input
          type="text"
          placeholder="방 코드를 입력하세요"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          className="modal-input"
        />
        <div className="modal-buttons">
          <button onClick={handleJoinRoom} className="modal-button join-button">
            확인
          </button>
          <button onClick={onClose} className="modal-button cancel-button">
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinRoomModal;
