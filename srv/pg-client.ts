import pkg from "pg";
const { Pool } = pkg;
import "dotenv/config";

let pool: any | null = null;

const pg = {
  async query(config: any) {
    if (!pool) {
      const config = {
        connectionString: process.env.VITE_DB_URL,
      };
      if (process.env.VITE_DB_SSL == "true") {
        config["ssl"] = {
          rejectUnauthorized: false,
        };
      }
      pool = new Pool(config);
    }

    let response = null;
    await pool
      .connect()
      .then(async (client: any) => {
        await client
          .query(config)
          .then((res: any) => {
            response = res;
          })
          .catch((err: any) => {
            throw err;
          })
          .finally(() => client.release());
      })
      .catch((err: any) => {
        throw err;
      });
    return response;
  },
};

export default pg;
