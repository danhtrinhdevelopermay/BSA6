import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { databaseConfig } from "./config/app-config";

neonConfig.webSocketConstructor = ws;

export const pool = new Pool({ connectionString: databaseConfig.url });
export const db = drizzle({ client: pool, schema });