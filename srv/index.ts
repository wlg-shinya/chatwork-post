import express from "express";
import axios from "axios";
import cors from "cors";

// 環境変数の読み込み
import dotenv from "dotenv";
dotenv.config({ path: ".env" });
import dotenvLocal from "dotenv";
dotenvLocal.config({ path: ".env.local" });

// リクエストボディから値を得る
function bodyValue(req: any, name: string, defaultValue?: any, outputLog = true) {
  if (typeof req.body[name] === "undefined") {
    if (typeof defaultValue === "undefined") {
      // 要素が見つからない場合
      // defaultValue を指定していなければ指定必須なので例外投げる
      throw new Error(`Not set body '${name}'`);
    } else {
      // defaultValue が指定されていれば未指定許容なのでデフォルト値を返す
      if (outputLog) console.log(`[${date()}]   ${name}=${defaultValue} (default)`);
      return defaultValue;
    }
  } else {
    // 要素が見つかったらその値を返す
    if (outputLog) console.log(`[${date()}]   ${name}=${req.body[name]}`);
    return req.body[name];
  }
}

function date() {
  return new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

const token = process.env.VITE_CHATWORK_API_TOKEN ?? "";

const app = express();
app.use(express.json());
app.use(cors());
const port = process.env.VITE_BACKEND_PORT ?? "";
app.listen(port, () => {
  console.log(`[${date()}] Server running at: ${process.env.VITE_BASE_URL}:${port}`);
  console.log(`[${date()}]   Chatwork API is ${token ? "available!" : "unavailable..."}`);
});

app.post("/api/chatwork_post_messages", (req: any, res: any) => {
  console.log(`[${date()}] /api/chatwork_post_messages`);
  const room_id = bodyValue(req, "room_id");
  const body = bodyValue(req, "body");
  const self_unread = bodyValue(req, "self_unread", 0);
  const config = {
    headers: {
      accept: "application/json",
      "content-type": "application/x-www-form-urlencoded",
      "x-chatworktoken": token,
    },
  };
  axios
    .post(
      `https://api.chatwork.com/v2/rooms/${room_id}/messages`,
      {
        body: body,
        self_unread: self_unread,
      },
      config
    )
    .then(() => {
      res.send();
    })
    .catch((err) => {
      throw err;
    });
});
