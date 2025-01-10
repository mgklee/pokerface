import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const SignInPage = ({ onSignIn }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add sign-in validation logic here
    alert(`Signed in as: ${email}`);
    onSignIn(); // Call the callback to indicate the user is signed in
    navigate("/"); // Redirect to the homepage
  };

  return (
    <div className="signin-page">
      <h1>Sign In</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Email:
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit">Sign In</button>
      </form>
      <p>
        Don't have an account?{" "}
        <button
          style={{
            background: "none",
            border: "none",
            color: "blue",
            textDecoration: "underline",
            cursor: "pointer",
          }}
          onClick={() => navigate("/signup")}
        >
          Sign Up
        </button>
        <button className="naver-login">
          naver login
        </button>
        <button className="kakao-login">
          kakao login
        </button>
      </p>
    </div>
  );
};

export default SignInPage;
