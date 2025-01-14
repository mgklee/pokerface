// Generate all missions
const missions = (() => {
  const types = ["keep", "limit", "raise"];
  const emotions = ["happy", "sad", "angry", "surprised", "neutral", "disgusted", "fearful"];
  const scores = [0.2, 0.4, 0.6, 0.8];
  const durations = [2, 4, 6, 8];
  const emotionTranslations = {
    "happy": "행복",
    "sad": "슬픔",
    "angry": "화남",
    "surprised": "놀람",
    "neutral": "중립",
    "disgusted": "역겨움",
    "fearful": "두려움",
  };

  const generatedMissions = [];

  types.forEach((type) => {
    emotions.forEach((emotion) => {
      if (type === "keep") {
        scores.forEach((score) => {
          durations.forEach((duration) => {
            generatedMissions.push({
              type,
              emotion,
              target: score,
              duration,
              description: `${duration}초 동안 ${emotionTranslations[emotion]} 수치를 ${(score * 100).toFixed(0)}% 이상으로 유지하세요.`,
            });
          });
        });
      } else if (type === "limit") {
        durations.forEach((duration) => {
          generatedMissions.push({
            type,
            emotion,
            duration,
            description: `${duration}초 동안 ${emotionTranslations[emotion]} 수치를 10% 이상 90% 이하로 유지하세요.`,
          });
        });
      } else {
        scores.forEach((score) => {
          generatedMissions.push({
            type,
            emotion,
            target: score,
            description: `${emotionTranslations[emotion]} 수치를 ${(score * 100).toFixed(0)}% 이상 올리세요.`,
          });
        });
      }
    });
  });

  return generatedMissions;
})();

// Export the missions table
export const getMissions = () => missions;

// Choose a random mission
export const chooseRandomMission = () => {
  const randomIndex = Math.floor(Math.random() * missions.length);
  return missions[randomIndex];
};
