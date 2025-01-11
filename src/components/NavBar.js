import React, {useEffect} from "react";
import { useNavigate } from "react-router-dom";

const NavBar = ({ isSignedIn, setIsSignedIn, openCreateRoomModal, openJoinRoomModal }) => {
  const navigate = useNavigate();

  // 백엔드에서 로그인 처리(시작)
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    setIsSignedIn(!!token); // 토큰이 있으면 로그인 상태
  }, []);
    // 백엔드에서 로그인 처리 (끝)

  const handleSignOut = () => {
    localStorage.removeItem("authToken"); // 토큰 삭제 (백엔드)
    localStorage.removeItem("userId"); // 사용자 ID 삭제 (백엔드)
    setIsSignedIn(false); // Update the signed-in state
    navigate("/"); // Redirect to the homepage
  };

  return (
    <nav style={styles.nav}>
      <button
        style={styles.logoButton}
        onClick={() => navigate("/")}
      >
        POKER FACE
      </button>
      {isSignedIn && (
        <>
          <button style={styles.button} onClick={openCreateRoomModal}>
            방 만들기
          </button>
          <button style={styles.button} onClick={openJoinRoomModal}>
            참가하기
          </button>
        </>
      )}
      <div style={styles.navItems}>
        {isSignedIn ? (
          <button style={styles.button} onClick={handleSignOut}>
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
