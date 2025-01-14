import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const SignUpPage = ({ onSignIn }) => {
  const [userId, setUserId] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const baseUrl = "https://172.10.7.34:5001";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다!");
      return;
    }
    setError(""); // Clear error if passwords match

    // 백엔드에서 회원가입 처리 (시작)
    try {
      const response = await fetch(`${baseUrl}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: userId,
          name: nickname,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "회원가입 실패");
        return;
      }

    alert(`${userId}로 가입했습니다. 닉네임: ${nickname}`);
    onSignIn(userId, nickname); // Call the callback to indicate the user is signed in
    navigate("/"); // Redirect to the homepage
    // 백엔드에서 회원가입 처리 (끝)

    } catch (error) {
      console.error("Sign-up error:", error);
      setError("회원가입 중 문제가 발생했습니다.");
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <h1 className="signup-title">회원가입</h1>
        <form onSubmit={handleSubmit} className="signup-form">
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
            <label htmlFor="nickname">닉네임</label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
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
          <div className="form-group">
            <label htmlFor="confirm-password">비밀번호 확인</label>
            <input
              type="password"
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="form-input"
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="signup-button">
            가입하기
          </button>
        </form>
        <p className="signup-footer">
          계정이 있으면 바로{" "}
          <button
            className="signin-link"
            onClick={() => navigate("/signin")}
          >
            로그인
          </button>
          하세요.
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;
