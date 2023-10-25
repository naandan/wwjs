import { Client } from "whatsapp-web.js";
import fs from "fs";
import express from "express";
import qrcode from "qrcode";
import { Server } from "socket.io";
import http from "http";
import { dirname } from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: "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",
  organization: "org-lp7SmyDsyYK03czoouO2QYH0",
});

const __dirname = dirname(fileURLToPath(import.meta.url));

// initial instance
const PORT = process.env.PORT || 8000;
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const client = new Client();

// index routing and middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  res.sendFile("index.html", { root: __dirname });
});

// initialize whatsapp and the example event
client.on("message", (msg) => {
  console.log(msg.from);
  if (msg.body == "!ping") {
    msg.reply("pong");
  } else if (msg.body == "skuy") {
    msg.reply("helo ma bradah");
  }
});
client.initialize();

// async function main() {
//   const chatCompletion = await openai.chat.completions.create({
//     messages: [{ role: "user", content: "Say this is a test" }],
//     model: "gpt-3.5-turbo",
//   });

//   console.log(chatCompletion.choices);
// }

// main();

// socket connection
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

  //   client.on("authenticated", (session) => {
  //     socket.emit("message", `${now} Whatsapp is authenticated!`);
  //     sessionCfg = session;
  //     fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
  //       if (err) {
  //         console.error(err);
  //       }
  //     });
  //   });

  //   client.on("auth_failure", function (session) {
  //     socket.emit("message", `${now} Auth failure, restarting...`);
  //   });

  //   client.on("disconnected", function () {
  //     socket.emit("message", `${now} Disconnected`);
  //     if (fs.existsSync(SESSION_FILE_PATH)) {
  //       fs.unlinkSync(SESSION_FILE_PATH, function (err) {
  //         if (err) return console.log(err);
  //         console.log("Session file deleted!");
  //       });
  //       client.destroy();
  //       client.initialize();
  //     }
  //   });
});

// send message routing
app.post("/send", async (req, res) => {
  const phone = req.body.phone;
  const message = req.body.message;

  const chatCompletion = await openai.chat.completions.create({
    messages: [{ role: "user", content: message }],
    model: "gpt-3.5-turbo",
  });

  console.log(chatCompletion.choices);

  client
    .sendMessage(`${phone}@c.us`, chatCompletion.choices[0].message.content)
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
