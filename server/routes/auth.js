const express = require("express");
const axios = require("axios");
const User = require("../models/User"); // MongoDB 모델
const router = express.Router();
const baseUrl = "https://172.10.7.34:3000";

router.get("/validate-token", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1]; // Bearer 토큰
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
    res.status(200).json({ message: "Valid token", user: decoded });
  });
});

router.post("/signin", async (req, res) => {
  const { providerId, password } = req.body;

  try {
    let user1 = await User.findOne({ providerId });
    if (!user1) { // 사용자가 없는 경우
      return res.status(400).json({ message: "사용자가 존재하지 않습니다." });
    }

    let user2 = await User.findOne({ providerId, password });
    if (!user2) { // 비밀번호가 틀린 경우
      return res.status(400).json({ message: "비밀번호가 틀렸습니다." });
    }

    res.status(200).json({ message: "로그인 성공!", user2 });
  } catch (error) {
    console.error("Sign-in error:", error);
    res.status(500).json({ message: "Sign-in failed" });
  }
});

router.post("/signup", async (req, res) => {
  console.log("Request Body:", req.body); // req.body 확인
  const { providerId, name, password } = req.body;

  try {
    let user = await User.findOne({ providerId });
    if (user) { // 사용자가 이미 존재할 경우
      return res.status(400).json({ message: "이미 존재하는 아이디입니다." });
    } else {  // 사용자가 없다면 새로 저장
      user = new User({
        provider: "none",
        providerId,
        name,
        password,
      });
      await user.save();
    }

    res.status(200).json({ message: "Sign-up successful", user });
  } catch (error) {
    console.error("Sign-up error:", error);
    res.status(500).json({ message: "Sign-up failed" });
  }
});

// 카카오 로그인 콜백
router.get("/kakao/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).json({ message: "Authorization code is missing" });
  }

  try {
    console.log("Authorization Code:", code);

    // 1. 액세스 토큰 요청
    const tokenResponse = await axios.post(
      "https://kauth.kakao.com/oauth/token",
      null,
      {
        params: {
          grant_type: "authorization_code",
          client_id: process.env.KAKAO_CLIENT_ID,
          redirect_uri: process.env.KAKAO_REDIRECT_URI,
          code,
        },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );
    console.log("Token Response:", tokenResponse.data);

    const accessToken = tokenResponse.data.access_token;

    // 2. 사용자 정보 요청
    const userResponse = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log("User Response:", userResponse.data);

    const kakaoUser = userResponse.data;
    const nickname = kakaoUser.properties?.nickname || kakaoUser.kakao_account?.profile?.nickname || "Unknown User";
    const profileImage = kakaoUser.properties?.profile_image || kakaoUser.kakao_account?.profile?.profile_image_url || null;

    // 3. 사용자 정보 DB 저장 또는 검색
    let user = await User.findOne({ provider: "kakao", providerId: kakaoUser.id });
    if (!user) {
      user = new User({
        provider: "kakao",
        providerId: kakaoUser.id,
        name: nickname,
        profileImage: profileImage,
      });
      await user.save();
    }

    console.log("Kakao로 로그인되었습니다.");
    console.log("Access Token:", accessToken);
    console.log("User ID:", user._id);
    res.redirect(
      `${baseUrl}/auth/kakao/callback?token=${accessToken}&userId=${user._id}&name=${user.name}`
    );
    // res.json({ message: "Login successful", token: accessToken, user });
  } catch (error) {
  console.error("Kakao login error:", error.response?.data || error.message); // 에러 메시지 출력
  res.status(500).json({ message: "Kakao login failed", error: error.response?.data });
  }
});

// 네이버 로그인 콜백
router.get("/naver/callback", async (req, res) => {
  const { code, state } = req.query;

  try {
    // 1. 네이버 액세스 토큰 요청
    const tokenResponse = await axios.post(
      "https://nid.naver.com/oauth2.0/token",
      null,
      {
        params: {
          grant_type: "authorization_code",
          client_id: process.env.NAVER_CLIENT_ID,
          client_secret: process.env.NAVER_CLIENT_SECRET,
          code,
          state,
        },
      }
    );
    const accessToken = tokenResponse.data.access_token;

    // 2. 사용자 정보 요청
    const userResponse = await axios.get("https://openapi.naver.com/v1/nid/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const naverUser = userResponse.data.response;

    // 3. 사용자 정보 DB 저장 또는 검색
    let user = await User.findOne({ provider: "naver", providerId: naverUser.id });
    if (!user) {
      user = new User({
        provider: "naver",
        providerId: naverUser.id,
        name: naverUser.name,
        email: naverUser.email,
        profileImage: naverUser.profile_image,
      });
      await user.save(); // 새로운 사용자 저장
    }

    // 4. 로그인 성공 (세션 또는 JWT 발급)
    console.log("Naver로 로그인되었습니다.");
    res.redirect(
      `${baseUrl}/auth/naver/callback?token=${accessToken}&userId=${user._id}&name=${user.name}`
    );
    // res.json({ message: "Login successful", user });
  } catch (error) {
    console.error("Naver login error:", error);
    res.status(500).json({ message: "Naver login failed" });
  }
});

module.exports = router;
