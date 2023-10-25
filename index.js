import { Client } from "whatsapp-web.js";
import express from "express";
import qrcode from "qrcode";
import { Server } from "socket.io";
import http from "http";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 8000;
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const client = new Client();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: __dirname });
});

client.initialize();

var today = new Date();
var now = today.toLocaleString();

io.on("connection", (socket) => {
  socket.emit("message", `${now} Connected`);

  client.on("qr", (qr) => {
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit("qr", url);
      socket.emit("message", `${now} QR Code received`);
    });
  });

  client.on("ready", () => {
    socket.emit("message", `${now} WhatsApp is ready!`);
  });
});

app.post("/send", async (req, res) => {
  const phone = req.body.phone;
  const message = req.body.message;

  client
    .sendMessage(`${phone}@c.us`, message)
    .then((response) => {
      res.status(200).json({
        error: false,
        data: {
          message: "Pesan terkirim",
          meta: response,
        },
      });
    })
    .catch((error) => {
      res.status(200).json({
        error: true,
        data: {
          message: "Error send message",
          meta: error,
        },
      });
    });
});

server.listen(PORT, () => {
  console.log("App listen on port ", PORT);
});
