const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const usersRoutes = require("./routes/users");
const WebSocket = require("ws");
const server = new WebSocket.Server({ port: 8080 });

// fs and https 모듈 가져오기
const https = require("https");
const fs = require("fs");

// certificate와 private key 가져오기
const options = {
  key: fs.readFileSync("../config/cert.key"),
  cert: fs.readFileSync("../config/cert.crt"),
};

const app = express();
app.use(cors());
app.use(express.json());

// https 의존성으로 certificate와 private key로 새로운 서버를 시작
https.createServer(options, app).listen(5001, () => {
  console.log(`HTTPS server started on port 5001`);
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

server.on("connection", (socket) => {
  console.log("클라이언트 연결됨");
  socket.on("message", (message) => {
    console.log("메시지 받음:", message);
    // 다른 클라이언트에 브로드캐스트
    server.clients.forEach((client) => {
      if (client !== socket && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
});

// 라우트 설정
app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
