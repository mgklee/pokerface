import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const KakaoCallback = ({ onSignIn }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // 현재 URL에서 token과 userId 추출
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    const userId = urlParams.get("userId");
    const name = urlParams.get("name");
    for (const [key, value] of urlParams) {
      console.log(`Key: ${key}, Value: ${value}`);
    }
    console.log(token);

    if (token) {
      localStorage.setItem("authToken", token); // 토큰 저장
      localStorage.setItem("userId", userId); // 사용자 ID 저장
      localStorage.setItem("name", name); // 사용자 ID 저장
      if (onSignIn) {
        onSignIn(userId, name); // 로그인 상태 업데이트
      }
      navigate("/"); // 홈 화면으로 이동
    } else {
      console.error("Token not found in URL.");
    }
  }, [navigate, onSignIn]);

  return <div>Processing Kakao Login...</div>;
};

export default KakaoCallback;