import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import './NavBar.css';

const NavBar = ({ isSignedIn, setIsSignedIn, nickname, openCreateRoomModal, openJoinRoomModal }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // 백엔드에서 로그인 처리
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    setIsSignedIn(!!token); // 토큰이 있으면 로그인 상태
  }, [setIsSignedIn]);

  const handleSignOut = () => {
    localStorage.removeItem("authToken"); // 토큰 삭제 (백엔드)
    localStorage.removeItem("userId"); // 사용자 ID 삭제 (백엔드)
    setIsSignedIn(false); // Update the signed-in state
    navigate("/"); // Redirect to the homepage
  };

  // Render navigation buttons
  const renderNavLinks = () => {
    if (location.pathname !== "/singleplay") {
      return (
        <button className="button" onClick={() => navigate("/singleplay")}>
          혼자 놀기
        </button>
      );
    }
    return null;
  };

  const renderSignedInLinks = () => {
    if (isSignedIn) {
      return (
        <>
          <button className="button" onClick={openCreateRoomModal}>
            방 만들기
          </button>
          <button className="button" onClick={openJoinRoomModal}>
            참가하기
          </button>
        </>
      );
    }
    return null;
  };

  return (
    <nav className="nav">
      <button className="logo-button" onClick={() => navigate("/")}>
        POKERFACE
      </button>
      <div className="nav-links">
        {renderNavLinks()}
        {renderSignedInLinks()}
      </div>
      <div className="nav-items">
        {isSignedIn ? (
          <div className="user-info">
            <span className="nickname">
              안녕하세요, {nickname} 님!</span>
            <button className="button" onClick={handleSignOut}>
              로그아웃
            </button>
          </div>
        ) : (
          <button className="button" onClick={() => navigate("/signin")}>
            로그인
          </button>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
