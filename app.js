import express from "express";
import cors from "cors";
import ejs from "ejs";
import routers from "./src/controller/controllerr.js";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import http from "http";
import socketio from "socket.io";
import messagesUtils from "./utils/messages.js";
import usersJS from "./utils/users.js";

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = socketio(server);
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.set("view engine", "html");
app.engine("html", ejs.renderFile);
app.set("views", "./public");
app.use("/", routers);
app.use("/", express.static("./public"));

io.on("connection", () => {
  console.log("New WebSocket connection");
});
io.on("connection", (socket) => {
  socket.on("join", (options, callback) => {
    const { error, user } = usersJS.addUser({ id: socket.id, ...options });
    if (error) {
      return callback(error);
    }
    socket.join(user.room);
    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const user = usersJS.getUser(socket.id);
    io.to(message.room).emit(
      "message",
      messagesUtils.generateMessage(message.username, message.text)
    );
    callback();
  });

  socket.on("disconnect", () => {
    const user = usersJS.removeUser(socket.id);

    if (user) {
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: usersJS.getUsersInRoom(user.room),
      });
    }
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is up on port ${port}!`);
});
