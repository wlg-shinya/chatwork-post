import express from "express";
import axios from "axios";
import cors from "cors";
import pg from "./pg-client";
import RoutingList from "./express-routing-list";
import { RegisteredData } from "../src/types";
import { concreteCondition, restoreCondition } from "../src/condition";

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
      throw new Error(`Not set req.body '${name}'`);
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

async function getRegisteredDataAll(): Promise<RegisteredData[]> {
  const queryText = `select * from register;`;
  const result = await pg.query(queryText);
  if (result == null) {
    throw new Error(`result='${result}'`);
  }
  const rows = result["rows"] as RegisteredData[];
  return rows.map((x: RegisteredData) => {
    const registeredData: RegisteredData = {
      id: x.id,
      room_id: x.room_id,
      body: x.body,
      self_unread: x.self_unread,
      post_condition: x.post_condition,
    };
    return registeredData;
  });
}

async function updateRegisteredData(data: RegisteredData) {
  const queryText = `UPDATE register SET (room_id,body,self_unread,post_condition) = (${data.room_id},${data.body},${data.self_unread},${data.post_condition}) WHERE id=${data.id};`;
  await pg.query(queryText);
}

const CHATWORK_API_TOKEN = process.env.VITE_CHATWORK_API_TOKEN ?? "";
function chatworkPostMessage(roomId: number, body: string, selfUnread: boolean) {
  const config = {
    headers: {
      accept: "application/json",
      "content-type": "application/x-www-form-urlencoded",
      "x-chatworktoken": CHATWORK_API_TOKEN,
    },
  };
  axios
    .post(
      `https://api.chatwork.com/v2/rooms/${roomId}/messages`,
      {
        body: body,
        self_unread: selfUnread,
      },
      config
    )
    .catch((err) => {
      throw err;
    });
}

async function pollingChatworkPostMessage() {
  setTimeout(async () => {
    const registeredDataArray = await getRegisteredDataAll();
    registeredDataArray.forEach((data: RegisteredData) => {
      const condition = concreteCondition(restoreCondition(data.post_condition));
      if (condition.check()) {
        // chatworkPostMessage(data.room_id, data.body, data.self_unread);
        console.log(`chatworkPostMessage(${data.room_id}, ${data.body}, ${data.self_unread})`);
        condition.update();
        // 条件更新後の情報をDBに反映
        updateRegisteredData({
          id: data.id,
          room_id: data.room_id,
          body: `'${data.body}'`,
          self_unread: data.self_unread,
          post_condition: `'${condition.getData()}'`,
        });
      }
    });
    pollingChatworkPostMessage();
  }, 1000);
}

function displayInfo() {
  // URL＆ポート番号
  console.log(`[${date()}] Server URL: ${process.env.VITE_BASE_URL}:${port}`);
  // ChatworkAPIが利用可能かどうか
  console.log(`[${date()}] Chatwork API: ${CHATWORK_API_TOKEN ? "available!" : "unavailable..."}`);
  // API一覧
  const routingList = RoutingList({ app });
  const routingListKeys = Object.keys(routingList);
  if (routingListKeys.length > 0) {
    console.log(`[${date()}] API route:`);
    routingListKeys.forEach((key) => {
      console.log(`[${date()}] - ${key}: ${routingList[key]}`);
    });
  }
}

const app = express();
app.use(express.json());
app.use(cors());
const port = process.env.VITE_BACKEND_PORT ?? "";
app.listen(port, () => {
  // チャット投稿監視開始
  pollingChatworkPostMessage();

  // 情報表示
  displayInfo();

  // 以降、expressのログ出力を待機
  console.log(`[${date()}] Log:`);
});

app.get("/api/db_register", async (req: any, res: any) => {
  console.log(`[${date()}] GET /api/db_register`);
  res.json(await getRegisteredDataAll());
});

app.post("/api/db_register", (req: any, res: any) => {
  console.log(`[${date()}] POST /api/db_register`);
  const room_id = Number(bodyValue(req, "room_id"));
  const body = `'${bodyValue(req, "body")}'`;
  const self_unread = bodyValue(req, "self_unread");
  const post_condition = `'${bodyValue(req, "post_condition")}'`;
  const queryText = `INSERT INTO register (room_id,body,self_unread,post_condition) VALUES (${room_id},${body},${self_unread},${post_condition});`;
  pg.query(queryText)
    .then(() => {
      res.send();
    })
    .catch((err) => {
      throw err;
    });
});

app.put("/api/db_register", async (req: any, res: any) => {
  console.log(`[${date()}] PUT /api/db_register`);
  await updateRegisteredData({
    id: Number(bodyValue(req, "id")),
    room_id: Number(bodyValue(req, "room_id")),
    body: `'${bodyValue(req, "body")}'`,
    self_unread: bodyValue(req, "self_unread"),
    post_condition: `'${bodyValue(req, "post_condition")}'`,
  });
  res.send();
});

app.delete("/api/db_register", (req: any, res: any) => {
  console.log(`[${date()}] DELETE /api/db_register`);
  const id = Number(bodyValue(req, "id"));
  const queryText = `DELETE FROM register WHERE id=${id};`;
  pg.query(queryText)
    .then(() => {
      res.send();
    })
    .catch((err) => {
      throw err;
    });
});
