import express from "express";
import axios from "axios";
import cors from "cors";
import pg from "./pg-client";
import "dotenv";
import RoutingList from "./express-routing-list";
import { RegisteredData } from "../src/types";
import { concreteCondition, restoreCondition } from "../src/condition";

// 指定リクエストデータの指定要素名から値を得る
// reqDataにはreq.queryかreq.bodyを指定
function reqValue({ reqData, name, defaultValue = null, outputLog = true }: { reqData: any; name: string; defaultValue?: any; outputLog?: boolean }) {
  if (typeof reqData[name] === "undefined") {
    if (defaultValue === null) {
      // 要素が見つからない場合
      // defaultValue を指定されていなければ指定必須なので例外投げる
      throw new Error(`Not set req.body '${name}'`);
    } else {
      // defaultValue が指定されていれば未指定許容なのでデフォルト値を返す
      if (outputLog) console.log(`[${date()}]   ${name}=${defaultValue} (default)`);
      return defaultValue;
    }
  } else {
    // 要素が見つかったらその値を返す
    if (outputLog) console.log(`[${date()}]   ${name}=${reqData[name]}`);
    return reqData[name];
  }
}

// HTTPエラーハンドラ
// https://qiita.com/yuta-katayama-23/items/5b8bf72236eec9cadf41
function httpErrorHandler(res: any, error: any) {
  if (error.response) {
    res.status(error.response.status).send({
      error: error.response.data,
      errorMsg: error.message,
    });
  } else {
    res.status(500).send({ errorMsg: error.message });
  }
}

function pgQuery(text: string): Promise<any> {
  console.log(`[${date()}] db=# ${text}`);
  return pg.query(text);
}

function date() {
  return new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

async function getRegisteredData(optQuery = ""): Promise<RegisteredData[]> {
  const result = await pgQuery(`SELECT * FROM register ${optQuery};`);
  if (result == null) {
    throw new Error(`result='${result}'`);
  }
  const rows = result["rows"] as RegisteredData[];
  return rows.map((x: RegisteredData) => {
    const registeredData: RegisteredData = {
      id: x.id,
      api_token: x.api_token,
      room_id: x.room_id,
      body: x.body,
      self_unread: x.self_unread,
      post_condition: x.post_condition,
    };
    return registeredData;
  });
}

async function updateRegisteredData(data: RegisteredData) {
  await pgQuery(
    `UPDATE register SET (api_token,room_id,body,self_unread,post_condition) = (${data.api_token},${data.room_id},${data.body},${data.self_unread},${data.post_condition}) WHERE id=${data.id};`
  );
}

function chatworkPostMessage(apiToken: string, roomId: number, body: string, selfUnread: boolean) {
  const config = {
    headers: {
      accept: "application/json",
      "content-type": "application/x-www-form-urlencoded",
      "x-chatworktoken": apiToken,
    },
  };
  // https://developer.chatwork.com/reference/post-rooms-room_id-messages
  const data = {
    body: body,
    self_unread: selfUnread ? 1 : 0,
  };
  const url = `https://api.chatwork.com/v2/rooms/${roomId}/messages`;
  console.log(`[${date()}] POST ${url}`);
  console.log(`[${date()}]   body=${data.body}`);
  console.log(`[${date()}]   self_unread=${data.self_unread}`);
  axios.post(url, data, config).catch((error) => {
    throw error;
  });
}

// チャット投稿判定の監視間隔(秒)
// DB負荷とチャット投稿時間遅延のトレードオフになるパラメータ
// ユーザには分単位での入力を許容しているので60より大きくするのは非推奨
const POLLING_INTERVAL_SEC = 30;
async function pollingChatworkPostMessage() {
  setTimeout(async () => {
    try {
      const registeredDataArray = await getRegisteredData();
      registeredDataArray.forEach((data: RegisteredData) => {
        const condition = concreteCondition(restoreCondition(data.post_condition));
        if (condition.check()) {
          // 条件を満たしたので実際にチャットへ投稿
          // TODO: このサービスから自動投稿されたことを示す文章を付与する
          chatworkPostMessage(data.api_token, data.room_id, data.body, data.self_unread);
          condition.update();
          // 条件更新後の情報をDBに反映
          updateRegisteredData({
            id: data.id,
            api_token: `'${data.api_token}'`,
            room_id: data.room_id,
            body: `'${data.body}'`,
            self_unread: data.self_unread,
            post_condition: `'${condition.getData()}'`,
          });
        }
      });
    } catch (error) {
      // エラー時は情報出力をしてプログラムは継続する
      console.log(`[${date()}] ${error}`);
    } finally {
      // 処理の成功如何に関わらず監視を継続
      pollingChatworkPostMessage();
    }
  }, POLLING_INTERVAL_SEC * 1000);
}

function displayInfo() {
  // URL＆ポート番号
  console.log(`[${date()}] Server URL: ${process.env.VITE_BACKEND_URL}:${port}`);
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
  // 以降、ログ出力を待機
  console.log(`[${date()}] Log:`);
});

app.get("/api/db_register", async (req: any, res: any) => {
  console.log(`[${date()}] GET /api/db_register`);
  try {
    const api_token = reqValue({ reqData: req.query, name: "api_token" });
    res.json(await getRegisteredData(`WHERE api_token='${api_token}'`));
  } catch (error) {
    httpErrorHandler(res, error);
  }
});

app.post("/api/db_register", (req: any, res: any) => {
  console.log(`[${date()}] POST /api/db_register`);
  try {
    const api_token = `'${reqValue({ reqData: req.body, name: "api_token" })}'`;
    const room_id = Number(reqValue({ reqData: req.body, name: "room_id" }));
    const body = `'${reqValue({ reqData: req.body, name: "body" })}'`;
    const self_unread = reqValue({ reqData: req.body, name: "self_unread" });
    const post_condition = `'${reqValue({ reqData: req.body, name: "post_condition" })}'`;
    pgQuery(
      `INSERT INTO register (api_token,room_id,body,self_unread,post_condition) VALUES (${api_token},${room_id},${body},${self_unread},${post_condition});`
    )
      .then(() => {
        res.send();
      })
      .catch((error) => {
        httpErrorHandler(res, error);
      });
  } catch (error) {
    httpErrorHandler(res, error);
  }
});

app.put("/api/db_register", async (req: any, res: any) => {
  console.log(`[${date()}] PUT /api/db_register`);
  try {
    await updateRegisteredData({
      id: Number(reqValue({ reqData: req.body, name: "id" })),
      api_token: `'${reqValue({ reqData: req.body, name: "api_token" })}'`,
      room_id: Number(reqValue({ reqData: req.body, name: "room_id" })),
      body: `'${reqValue({ reqData: req.body, name: "body" })}'`,
      self_unread: reqValue({ reqData: req.body, name: "self_unread" }),
      post_condition: `'${reqValue({ reqData: req.body, name: "post_condition" })}'`,
    });
    res.send();
  } catch (error) {
    httpErrorHandler(res, error);
  }
});

app.delete("/api/db_register", (req: any, res: any) => {
  console.log(`[${date()}] DELETE /api/db_register`);
  try {
    const id = Number(reqValue({ reqData: req.body, name: "id" }));
    pgQuery(`DELETE FROM register WHERE id=${id};`)
      .then(() => {
        res.send();
      })
      .catch((error) => {
        httpErrorHandler(res, error);
      });
  } catch (error) {
    httpErrorHandler(res, error);
  }
});

app.get("/api/chatwork_account", async (req: any, res: any) => {
  console.log(`[${date()}] GET /api/chatwork_account`);
  try {
    const api_token = reqValue({ reqData: req.query, name: "api_token" });

    const config = {
      headers: {
        accept: "application/json",
        "x-chatworktoken": api_token,
      },
    };
    // https://developer.chatwork.com/reference/get-me
    const url = "https://api.chatwork.com/v2/me";
    console.log(`[${date()}] GET ${url}`);
    axios
      .get(url, config)
      .then((response) => {
        res.json(response.data);
      })
      .catch((error) => {
        httpErrorHandler(res, error);
      });
  } catch (error) {
    httpErrorHandler(res, error);
  }
});

app.get("/api/chatwork_room", async (req: any, res: any) => {
  console.log(`[${date()}] GET /api/chatwork_room`);
  try {
    const api_token = reqValue({ reqData: req.query, name: "api_token" });
    const room_id = reqValue({ reqData: req.query, name: "room_id" });

    const config = {
      headers: {
        accept: "application/json",
        "x-chatworktoken": api_token,
      },
    };
    // https://developer.chatwork.com/reference/get-rooms-room_id
    const url = `https://api.chatwork.com/v2/rooms/${room_id}`;
    console.log(`[${date()}] GET ${url}`);
    axios
      .get(url, config)
      .then((response) => {
        res.json(response.data);
      })
      .catch((error) => {
        httpErrorHandler(res, error);
      });
  } catch (error) {
    httpErrorHandler(res, error);
  }
});

app.get("/api/chatwork_room_members", async (req: any, res: any) => {
  console.log(`[${date()}] GET /api/chatwork_room_members`);
  try {
    const api_token = reqValue({ reqData: req.query, name: "api_token" });
    const room_id = reqValue({ reqData: req.query, name: "room_id" });

    const config = {
      headers: {
        accept: "application/json",
        "x-chatworktoken": api_token,
      },
    };
    // https://developer.chatwork.com/reference/get-rooms-room_id-members
    const url = `https://api.chatwork.com/v2/rooms/${room_id}/members`;
    console.log(`[${date()}] GET ${url}`);
    axios
      .get(url, config)
      .then((response) => {
        res.json(response.data);
      })
      .catch((error) => {
        httpErrorHandler(res, error);
      });
  } catch (error) {
    httpErrorHandler(res, error);
  }
});
