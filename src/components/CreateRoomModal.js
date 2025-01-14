import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateRoomModal.css";

const CreateRoomModal = ({ onClose }) => {
  const [participants, setParticipants] = useState(2);
  const navigate = useNavigate();

  const handleIncrement = () => {
    if (participants < 6) {
      setParticipants((prev) => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (participants > 2) {
      setParticipants((prev) => prev - 1);
    }
  };

  const handleCreateRoom = () => {
    const randDomain = Math.random().toString(36).substring(7);
    alert(`${participants}명 방을 만들었습니다!`);
    onClose(); // Close the modal after navigation
    navigate(`/room/${randDomain}`, {state: {participants: participants}});
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>방 만들기</h2>
        <label htmlFor="participants">참가자 수</label>
        <div className="counter-container">
          <button
            onClick={handleDecrement}
            className="counter-button decrement-button"
            disabled={participants <= 2}
          >
            -
          </button>
          <span className="counter-value">{participants}</span>
          <button
            onClick={handleIncrement}
            className="counter-button increment-button"
            disabled={participants >= 6}
          >
            +
          </button>
        </div>
        <div className="modal-buttons">
          <button onClick={handleCreateRoom} className="modal-button create-button">
            만들기
          </button>
          <button onClick={onClose} className="modal-button cancel-button">
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateRoomModal;
