import React from "react";

const Mission = ({ currentMission, missionProgress, missionCompleted }) => {
  return (
    <div style={{ flex: 1, textAlign: "center" }}>
      {currentMission ? (
        <div>
          <h2>미션: {currentMission.description}</h2>
          {missionCompleted ? (
            <p style={{ color: "green" }}>미션 성공!</p>
          ) : (
            <p>
              현재 기록: {currentMission.type === "raise" ? (
                `${(missionProgress * 100).toFixed(0)}%`
              ) : (
                `${missionProgress.toFixed(1)}초`
              )}
            </p>
          )}
        </div>
      ) : (
        <p>No active mission</p>
      )}
    </div>
  );
};

export default Mission;
