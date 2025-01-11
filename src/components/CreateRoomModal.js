import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateRoomModal.css";

const CreateRoomModal = ({ onClose }) => {
  const [participants, setParticipants] = useState(1);
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    alert(`${participants}명 방을 만들었습니다!`);
    onClose(); // Close the modal after navigation
    navigate(`/room/${participants}`);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>방 만들기</h2>
        <label htmlFor="participants">참가자 수</label>
        <select
          id="participants"
          value={participants}
          onChange={(e) => setParticipants(Number(e.target.value))}
          className="modal-select"
        >
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
          <option value={4}>4</option>
        </select>
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
