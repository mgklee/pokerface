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
const users = [];
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

    switch (message.type) {
      case "join-room":
        users[message.userId] = socket;
        console.log(`User ${message.userId} joined room ${message.roomId}`);

        // 다른 사용자에게 새 사용자 정보 알림
        Object.values(users).forEach((userSocket) => {
          if (userSocket !== socket) {
            userSocket.send(
              JSON.stringify({ type: "new-user", userId: message.userId })
            );
          }
        });
        break;

      case "offer":
      case "answer":
      case "ice-candidate":
        const targetSocket = users[message.target];
        if (targetSocket) {
          targetSocket.send(
            JSON.stringify({
              ...message,
              sender: Object.keys(users).find((key) => users[key] === socket),
            })
          );
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
      console.log(`User ${userId} disconnected`);
    }
  });
});

// 라우트 설정
app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
