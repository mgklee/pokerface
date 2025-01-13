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
const users = {};
app.use(cors());
app.use(express.json());
const httpsServer = https.createServer(options, app);
const wss = new WebSocket.Server({server: httpsServer});

// https 의존성으로 certificate와 private key로 새로운 서버를 시작
httpsServer.listen(5001, () => {
  console.log(`HTTPS server started on port 5001`);
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

wss.on("connection", (socket) => {
  socket.on("message", (data) => {
    const message = JSON.parse(data);
    // console.log("Received message:", message);
    
    switch (message.type) {
      // 클라이언트에서 받은 정보가 '방 참여'일 때
      case "join-room":
        users[message.userId] = socket;
        console.log(`User ${message.userId} joined room ${message.roomId}`);

        Object.values(users).forEach((userSocket) => {
          if (userSocket !== socket) {
            userSocket.send(JSON.stringify({ type: "new-user", userId: message.userId }));
          }
        });

        // 새 사용자에게 기존 사용자 목록 전달
        // const existingUsers = Object.keys(users).filter(
        //   (userId) => users[userId] !== socket
        // );
        // socket.send(
        //   JSON.stringify({ type: "existing-users", users: existingUsers })
        // );
        break;
      
      case "offer":
        console.log("Received Offer:", message.offer);
        const offerTargetSocket = users[message.target];
        if (offerTargetSocket) {
          console.log(`Forwarding Offer to ${message.target}`);
          offerTargetSocket.send(
            JSON.stringify({
              type: "offer",
              offer: message.offer,
              sender: Object.keys(users).find((key) => users[key] === socket),
            })
          );
        } else {
          console.log(`Target user ${message.target} not found.`);
        }
        break;
      
      case "answer":
        console.log("Received Answer:", message.answer);
        const answerTargetSocket = users[message.target];
        if (answerTargetSocket) {
          console.log(`Forwarding Answer to ${message.target}`);
          answerTargetSocket.send(
            JSON.stringify({
              type: "answer",
              answer: message.answer,
              sender: Object.keys(users).find((key) => users[key] === socket),
            })
          );
        } else {
          console.log(`Target user ${message.target} not found.`);
        }
        break;
      
      case "ice-candidate":
        const targetSocket = users[message.target];
        if (targetSocket) {
          console.log(`Forwarding ICE candidate to ${message.target}`);
          targetSocket.send(
            JSON.stringify({
              ...message,
              candidate: message.candidate,
              sender: Object.keys(users).find((key) => users[key] === socket),
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
    const userId = Object.keys(users).find((key) => users[key] === socket);
    if (userId) {
      delete users[userId];
      // 사용자가 웹소켓 연결 종료할 때
      console.log(`User ${userId} disconnected`);
      // 다른 사용자에게 연결 종료 알림
      // Object.values(users).forEach((userSocket) => {
      //   userSocket.send(
      //     JSON.stringify({ type: "user-left", userId })
      //   );
      // });
    }
  });
});

// 라우트 설정
app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
