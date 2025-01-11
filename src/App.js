import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import CreateRoomModal from './components/CreateRoomModal';
import JoinRoomModal from './components/JoinRoomModal';
import SignInPage from "./pages/SignIn";
import SignUpPage from "./pages/SignUp";
import RoomPage from './pages/Room';
import KakaoCallback from "./Login/KakaoCallback";
import NaverCallback from "./Login/NaverCallback";
import './App.css';

const App = () => {
  // State to track whether the user is signed in
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
        openCreateRoomModal={openCreateRoomModal}
        openJoinRoomModal={openJoinRoomModal}
      />
      <Routes>
        <Route
          path="/"
          element={
            <div className="homepage">
              {isSignedIn ? (
                <div className="user-info">
                  <h1>안녕하세요, {nickname}님!</h1>
                  {/* <h1>아이디: {userId}</h1> */}
                </div>
              ) : (
                <h1>환영합니다!</h1>
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
            <KakaoCallback
              onSignIn={(id) => {
                setIsSignedIn(true);
                setUserId(id);
              }}
            />
          }
        />
        <Route
          path="/auth/naver/callback"
          element={
            <NaverCallback
              onSignIn={(id) => {
                setIsSignedIn(true);
                setUserId(id);
              }}
            />
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
