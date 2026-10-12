import pg from "pg";
import { attachDatabasePool } from "@neon/functions";
import { createApi } from "./api.mjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5, connectionTimeoutMillis: 10000, idleTimeoutMillis: 30000 });
attachDatabasePool(pool);
export default createApi(pool);
