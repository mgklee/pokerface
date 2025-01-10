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
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [isJoinRoomModalOpen, setIsJoinRoomModalOpen] = useState(false);

  const handleSignOut = () => {
    setIsSignedIn(false);
  };

  const openCreateRoomModal = () => {
    if (isSignedIn)
      setIsCreateRoomModalOpen(true);
  };

  const openJoinRoomModal = () => {
    if (isSignedIn)
      setIsJoinRoomModalOpen(true);
  }

  const closeCreateRoomModal = () => setIsCreateRoomModalOpen(false);
  const closeJoinRoomModal = () => setIsJoinRoomModalOpen(false);

  return (
    <Router>
      <NavBar
        isSignedIn={isSignedIn}
        openCreateRoomModal={openCreateRoomModal}
        openJoinRoomModal={openJoinRoomModal}
        onSignOut={handleSignOut}
      />
      <Routes>
        <Route
          path="/"
          element={
            <div className="homepage">
              <h1>환영합니다!</h1>
              {isCreateRoomModalOpen && <CreateRoomModal onClose={closeCreateRoomModal} />}
              {isJoinRoomModalOpen && <JoinRoomModal onClose={closeJoinRoomModal} />}
            </div>
          }
        />
        <Route
          path="/signin"
          element={
            <SignInPage
              onSignIn={() => setIsSignedIn(true)} // Set the user as signed in when they sign in
            />
          }
        />
        <Route
          path="/signup"
          element={
            <SignUpPage
              onSignIn={() => setIsSignedIn(true)} // Set the user as signed in when they sign in
            />
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
