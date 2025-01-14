import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import "./App.css";

import NavBar from "./components/NavBar";
import CreateRoomModal from "./components/CreateRoomModal";
import JoinRoomModal from "./components/JoinRoomModal";
import MyPage from "./components/MyPage";

import KakaoCallback from "./utils/KakaoCallback";
import NaverCallback from "./utils/NaverCallback";

import SinglePlayPage from "./pages/SinglePlay";
import SignInPage from "./pages/SignIn";
import SignUpPage from "./pages/SignUp";
import RoomPage from "./pages/Room";

const App = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userId, setUserId] = useState("");
  const [nickname, setNickname] = useState("");
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [isJoinRoomModalOpen, setIsJoinRoomModalOpen] = useState(false);

  const onSignIn = (id, nickname) => {
    setIsSignedIn(true);
    setUserId(id);
    setNickname(nickname);
  }

  const openCreateRoomModal = () => setIsCreateRoomModalOpen(true);
  const closeCreateRoomModal = () => setIsCreateRoomModalOpen(false);

  const openJoinRoomModal = () => setIsJoinRoomModalOpen(true);
  const closeJoinRoomModal = () => setIsJoinRoomModalOpen(false);

  return (
    <Router>
      <NavBar
        isSignedIn={isSignedIn}
        setIsSignedIn={setIsSignedIn}
        nickname={nickname}
        openCreateRoomModal={openCreateRoomModal}
        openJoinRoomModal={openJoinRoomModal}
      />
      <Routes>
        <Route
          path="/"
          element={
            <div className="homepage">
              {isSignedIn ? (
                <MyPage userId={userId}/>
              ) : (
                <h1>환영합니다! <Link to="/signin" className="signin-link">로그인</Link>하여<br/>
                게임에 참가하세요!</h1>
              )}
            </div>
          }
        />
        <Route
          path="/signin"
          element={
            <SignInPage onSignIn={onSignIn}/>
          }
        />
        <Route
          path="/signup"
          element={
            <SignUpPage onSignIn={onSignIn}/>
          }
        />
        <Route
          path="/auth/kakao/callback"
          element={
            <KakaoCallback onSignIn={onSignIn}/>
          }
        />
        <Route
          path="/auth/naver/callback"
          element={
            <NaverCallback onSignIn={onSignIn}/>
          }
        />
        <Route
          path="/singleplay"
          element={
            <SinglePlayPage />
          }
        />
        <Route path="/room/:roomId" element={<RoomPage />} />
      </Routes>
      {isCreateRoomModalOpen && <CreateRoomModal onClose={closeCreateRoomModal} />}
      {isJoinRoomModalOpen && <JoinRoomModal onClose={closeJoinRoomModal} />}
    </Router>
  );
};

export default App;
