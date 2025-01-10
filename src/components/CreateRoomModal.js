import React, { useState } from "react";
import './CreateRoomModal.css';

const CreateRoomModal = ({ onClose }) => {
  const [participants, setParticipants] = useState(1);

  const handleCreateRoom = () => {
    alert(`Creating a room for ${participants} participant(s).`);
    onClose(); // Close the modal after submission
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Create Room</h2>
        <label htmlFor="participants">Number of Participants:</label>
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
            Create
          </button>
          <button onClick={onClose} className="modal-button cancel-button">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateRoomModal;
