const express = require("express");
const axios = require("axios");
const qs = require("qs");

const app = express();

const KAKAO_CLIENT_ID = "YOUR_CLIENT_ID";
const KAKAO_REDIRECT_URI = "http://localhost:5001/auth/kakao/callback";

const NAVER_CLIENT_ID = "YOUR_CLIENT_ID";
const NAVER_CLIENT_SECRET = "YOUR_CLIENT_SECRET";
const NAVER_REDIRECT_URI = "http://localhost:5001/auth/naver/callback";

// 카카오 로그인 콜백
app.get("/auth/kakao/callback", async (req, res) => {
  const { code } = req.query;

  // 1. 액세스 토큰 요청
  const tokenResponse = await axios.post(
    "https://kauth.kakao.com/oauth/token",
    qs.stringify({
      grant_type: "authorization_code",
      client_id: KAKAO_CLIENT_ID,
      redirect_uri: KAKAO_REDIRECT_URI,
      code,
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  const accessToken = tokenResponse.data.access_token;

  // 2. 사용자 정보 요청
  const userResponse = await axios.get("https://kapi.kakao.com/v2/user/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const userInfo = userResponse.data;
  console.log("Kakao User Info:", userInfo);

  res.json({ message: "Kakao Login Success", userInfo });
});

// 네이버 로그인 콜백
app.get("/auth/naver/callback", async (req, res) => {
  const { code, state } = req.query;

  // 1. 액세스 토큰 요청
  const tokenResponse = await axios.post(
    "https://nid.naver.com/oauth2.0/token",
    qs.stringify({
      grant_type: "authorization_code",
      client_id: NAVER_CLIENT_ID,
      client_secret: NAVER_CLIENT_SECRET,
      code,
      state,
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  const accessToken = tokenResponse.data.access_token;

  // 2. 사용자 정보 요청
  const userResponse = await axios.get("https://openapi.naver.com/v1/nid/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const userInfo = userResponse.data;
  console.log("Naver User Info:", userInfo);

  res.json({ message: "Naver Login Success", userInfo });
});

// 서버 실행
app.listen(5001, () => console.log("Server running on http://localhost:5001"));