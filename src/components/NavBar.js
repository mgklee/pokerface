import React from "react";
import { useNavigate } from "react-router-dom";

const NavBar = ({ isSignedIn, openCreateRoomModal, openJoinRoomModal, onSignOut }) => {
  const navigate = useNavigate();

  return (
    <nav style={styles.nav}>
      <button
        style={styles.logoButton}
        onClick={() => navigate("/")}
      >
        POKER FACE
      </button>
      { isSignedIn && (
        <>
          <button style={styles.button} onClick={openCreateRoomModal}>
            Create Room
          </button>
          <button style={styles.button} onClick={openJoinRoomModal}>
            Join Room
          </button>
        </>
      )}
      <div style={styles.navItems}>
        {isSignedIn ? (
          <button style={styles.button} onClick={onSignOut}>
            로그아웃
          </button>
        ) : (
          <button
            style={styles.button}
            onClick={() => navigate("/signin")}
          >
            로그인
          </button>
        )}
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 20px",
    backgroundColor: "#282c34",
    color: "white",
  },
  logoButton: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    backgroundColor: "transparent",
    color: "white",
    border: "none",
    cursor: "pointer",
    textAlign: "left",
  },
  navItems: {
    display: "flex",
    gap: "10px",
  },
  button: {
    padding: "10px 20px",
    border: "none",
    borderRadius: "5px",
    backgroundColor: "#61dafb",
    color: "white",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "bold",
  },
};

export default NavBar;
