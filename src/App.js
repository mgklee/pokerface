import './App.css';
import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import NavBar from "./components/NavBar";
import CreateRoomModal from './components/CreateRoomModal';
import JoinRoomModal from './components/JoinRoomModal';
import SignInPage from "./pages/SignIn";
import SignUpPage from "./pages/SignUp";

const App = () => {
  // State to track whether the user is signed in
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userId, setUserId] = useState("");
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [isJoinRoomModalOpen, setIsJoinRoomModalOpen] = useState(false);

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
                  <h1>안녕하세요, {userId}님!</h1>
                </div>
              ) : (
                <h1>환영합니다!</h1>
              )}
              {isCreateRoomModalOpen && <CreateRoomModal onClose={closeCreateRoomModal} />}
              {isJoinRoomModalOpen && <JoinRoomModal onClose={closeJoinRoomModal} />}
            </div>
          }
        />
        <Route
          path="/signin"
          element={
            <SignInPage
              onSignIn={(id) => {
                setIsSignedIn(true);
                setUserId(id);
              }}
            />
          }
        />
        <Route
          path="/signup"
          element={
            <SignUpPage
              onSignIn={() => setIsSignedIn(true)} // Set the user as signed in when they sign up
            />
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
