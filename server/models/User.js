const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  provider: { type: String, required: true }, // 'kakao' or 'naver'
  providerId: { type: String, required: true, unique: true }, // 카카오/네이버/일반 사용자 ID
  password: { type: String, required: true }, // 패스워드 (일반만)
  name: { type: String, required: true }, // 사용자 이름
  email: { type: String }, // 이메일 (네이버만 제공)
  profileImage: { type: String }, // 프로필 이미지 URL
  createdAt: { type: Date, default: Date.now }, // 가입 시간
  games: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  items: [
    {
      type: { type: String, required: true },
      content: { type: String, required: true },
    },
  ],
});

module.exports = mongoose.model("User", userSchema);