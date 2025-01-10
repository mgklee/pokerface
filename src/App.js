import './App.css';
import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import NavBar from "./components/NavBar";
import SignInPage from "./pages/SignIn";
import SignUpPage from "./pages/SignUp";

const App = () => {
  // State to track whether the user is signed in
  const [isSignedIn, setIsSignedIn] = useState(false);

  const handleSignOut = () => {
    setIsSignedIn(false);
    alert("You have signed out!");
  };

  return (
    <Router>
      <NavBar isSignedIn={isSignedIn} onSignOut={handleSignOut} />
      <Routes>
        <Route
          path="/"
          element={
            <div className="homepage">
              <h1>Welcome to My Homepage!</h1>
              {isSignedIn && (
                <div className="room-buttons">
                  <button className="create-room">Create Room</button>
                  <button className="join-room">Join Room</button>
                </div>
              )}
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
        <Route path="/signup" element={<SignUpPage />} />
      </Routes>
    </Router>
  );
};

export default App;
