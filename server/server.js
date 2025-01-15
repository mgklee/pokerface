const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const usersRoutes = require("./routes/users");
const WebSocket = require("ws");

// fs and https 모듈 가져오기
const https = require("https");
const fs = require("fs");

// certificate와 private key 가져오기
const options = {
  key: fs.readFileSync("../config/cert.key"),
  cert: fs.readFileSync("../config/cert.crt"),
};

const app = express();
const rooms = {}; // 방별 사용자 관리
const maxtime = 10;
let roomTurns = {};
app.use(cors());
app.use(express.json());
const httpsServer = https.createServer(options, app);
const wss = new WebSocket.Server({ server: httpsServer });

// https 의존성으로 certificate와 private key로 새로운 서버를 시작
httpsServer.listen(5001, () => {
  console.log(`HTTPS server started on port 5001`);
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

wss.on("connection", (socket) => {
  let currentUser = null;
  let currentRoom = null;

  socket.on("message", (data) => {
    const message = JSON.parse(data);

    switch (message.type) {
      case "shared-item":
        const expireTime = Date.now() + 1000 * maxtime;

        // 현재 방의 모든 사용자에게 메시지 전달
        rooms[currentRoom]?.participants.forEach((participant) => {
          if (participant.userId !== currentUser) {
            participant.socket.send(
              JSON.stringify({ type: "shared-item", item: message.item, expireTime, })
            );
          }
        });
        break;

      case "join-room":
        currentRoom = message.roomId;
        currentUser = message.userId;

        // 방 정보 초기화
        if (!rooms[currentRoom]) {
          rooms[currentRoom] = { participants: [], maxParticipants: message.maxParticipants || 10 };
        }

        // 참가자 수 초과 확인
        if (rooms[currentRoom].participants.length >= rooms[currentRoom].maxParticipants) {
          socket.send(JSON.stringify({ type: "room-full" }));
          return;
        }

        // 사용자 등록
        rooms[currentRoom].participants.push({ userId: currentUser, socket });
        console.log(`User ${currentUser} joined room ${currentRoom}`);

        // 다른 사용자에게 알림
        rooms[currentRoom].participants.forEach((participant) => {
          if (participant.userId !== currentUser) {
            participant.socket.send(JSON.stringify({ type: "new-user", userId: currentUser }));
          }
        });

        // 방에 처음 사용자가 들어오면 턴을 설정
        if (rooms[currentRoom].participants.length === 1) {
          roomTurns[currentRoom] = currentUser; // 첫 번째 사용자에게 턴 할당
          socket.send(JSON.stringify({ type: "turn-update", currentTurn: currentUser }));
        }
        break;
      
      case "end-turn":
        const roomParticipants = rooms[currentRoom].participants;
        const currentIndex = roomParticipants.findIndex((p) => p.userId === currentUser);
      
        // 다음 턴 계산
        const nextIndex = (currentIndex + 1) % roomParticipants.length;
        const nextTurnUser = roomParticipants[nextIndex].userId;
        
        // 턴 정보 업데이트 및 알림
        roomTurns[currentRoom] = nextTurnUser;
        roomParticipants.forEach((participant) => {
          participant.socket.send(JSON.stringify({ type: "turn-update", currentTurn: nextTurnUser }));
        });
        break;

      case "offer":
        const offerTarget = rooms[currentRoom]?.participants.find(
          (p) => p.userId === message.target
        );
        if (offerTarget) {
          offerTarget.socket.send(
            JSON.stringify({
              type: "offer",
              offer: message.offer,
              sender: rooms[currentRoom]?.participants.find((p) => p.socket === socket)?.userId || currentUser,
            })
          );
        } else {
          console.log(`Target user ${message.target} not found.`);
        }
        break;

      case "answer":
        const answerTarget = rooms[currentRoom]?.participants.find(
          (p) => p.userId === message.target
        );
        if (answerTarget) {
          answerTarget.socket.send(
            JSON.stringify({
              type: "answer",
              answer: message.answer,
              sender: currentUser,
            })
          );
        } else {
          console.log(`Target user ${message.target} not found.`);
        }
        break;

      case "ice-candidate":
        const candidateTarget = rooms[currentRoom]?.participants.find(
          (p) => p.userId === message.target
        );
        if (candidateTarget) {
          candidateTarget.socket.send(
            JSON.stringify({
              type: "ice-candidate",
              candidate: message.candidate,
              sender: currentUser,
            })
          );
        } else {
          console.log(`Target user ${message.target} not found.`);
        }
        break;

      default:
        console.log("Unknown message type:", message.type);
    }
  });

  socket.on("close", () => {
    if (currentUser && currentRoom) {
      rooms[currentRoom].participants = rooms[currentRoom].participants.filter(
        (p) => p.userId !== currentUser
      );

      console.log(`User ${currentUser} disconnected from room ${currentRoom}`);

      // 다른 사용자에게 연결 종료 알림
      rooms[currentRoom].participants.forEach((participant) => {
        participant.socket.send(
          JSON.stringify({ type: "user-left", userId: currentUser })
        );
      });
    }
  });
});

// 라우트 설정
app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
