import React, { useState, useEffect } from "react";
import Mission from "../components/Mission";
import EmotionRecognition from "../components/EmotionRecognition";
import { chooseRandomMission } from "../utils/missionUtils";

const SinglePlayPage = () => {
  const [currentMission, setCurrentMission] = useState(null);
  const [missionProgress, setMissionProgress] = useState(0);
  const [missionCompleted, setMissionCompleted] = useState(false);

  useEffect(() => {
    // Initialize with a random mission
    setCurrentMission(chooseRandomMission());
  }, []);

  const handleMissionReset = () => {
    setCurrentMission(chooseRandomMission());
    setMissionProgress(0);
    setMissionCompleted(false);
  };

  return (
    <div className="homepage">
      <div className="mission">
        <Mission
          currentMission={currentMission}
          missionProgress={missionProgress}
          missionCompleted={missionCompleted}
        />
        <button
          onClick={handleMissionReset}
        >
          다음
        </button>
      </div>
      <EmotionRecognition
        currentMission={currentMission}
        missionProgress={missionProgress}
        setMissionProgress={setMissionProgress}
        setMissionCompleted={setMissionCompleted}
      />
    </div>
  );
};

export default SinglePlayPage;
