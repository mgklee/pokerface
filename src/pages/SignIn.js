import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const SignInPage = ({ onSignIn }) => {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add sign-in validation logic here
    // alert(`Signed in as ID: ${userId}`);
    onSignIn(userId); // Call the callback to indicate the user is signed in
    navigate("/"); // Redirect to the homepage
  };
  const KAKAO_AUTH_URL = `https://kauth.kakao.com/oauth/authorize?client_id=6c7826890b2dfbb3924ce9491ac3a492&redirect_uri=http://localhost:5001/auth/kakao/callback&response_type=code`;
  const NAVER_AUTH_URL = `https://nid.naver.com/oauth2.0/authorize?client_id=UTeD3wg5vzrVdKMYkLga&redirect_uri=http://localhost:5001/auth/naver/callback&response_type=code`;

  return (
    <div className="signin-container">
      <div className="signin-box">
        <h1 className="signin-title">로그인</h1>
        <form onSubmit={handleSubmit} className="signin-form">
          <div className="form-group">
            <label htmlFor="userId">아이디</label>
            <input
              type="text"
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
            />
          </div>
          <button type="submit" className="signin-button">
            로그인
          </button>
        </form>
        <p className="signin-footer">
          계정이 없으세요?{" "}
          <button
            className="signup-link"
            onClick={() => navigate("/signup")}
          >
            가입하기
          </button>
        </p>
        <div className="social-login">
          <button className="naver-login"
            onClick = {() => (window.location.href = NAVER_AUTH_URL)}
          >
            네이버로 로그인하기</button>
          <button className="kakao-login"
            onClick = {() => (window.location.href = KAKAO_AUTH_URL)}
          >
            카카오로 로그인하기</button>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
