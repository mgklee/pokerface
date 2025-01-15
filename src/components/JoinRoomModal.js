import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./JoinRoomModal.css";

const JoinRoomModal = ({ onClose, userId }) => {
  const [roomCode, setRoomCode] = useState("");
  const navigate = useNavigate();

  const handleJoinRoom = () => {
    alert(`[${roomCode}] 방에 입장합니다.`);
    onClose(); // Close the modal after submission
    navigate(`/room/${roomCode}`, {
      state: {
        userId: userId
      }
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>참가하기</h2>
        <form onSubmit={handleJoinRoom}>
          <input
            type="text"
            placeholder="방 코드를 입력하세요"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            required
            className="modal-input"
          />
          <div className="modal-buttons">
            <button type="submit" className="modal-button join-button">
              확인
            </button>
            <button onClick={onClose} className="modal-button cancel-button">
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinRoomModal;
