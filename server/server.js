const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const authRoutes = require("./routes/auth");
const WebSocket = require("ws");
const server = new WebSocket.Server({ port: 8080 });

const app = express();
app.use(cors());
app.use(express.json());

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

const PORT = 5001;
app.listen(PORT, () => console.log(`Server running on http://172.10.7.34:${PORT}`));
