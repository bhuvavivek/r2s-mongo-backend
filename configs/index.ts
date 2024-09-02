import dotEnv from "dotenv";

if (process.env.NODE_ENV !== "production") {
  const configFile: string = `./.env.dev`;
  dotEnv.config({ path: configFile });
} else {
  dotEnv.config();
}

interface Config {
  PORT?: number;
  DB_URL?: string;
  APP_SECRET?: string;
}

const config: Config = {
  PORT: process.env.PORT ? parseInt(process.env.PORT) : undefined,
  DB_URL: process.env.MONGODB_URI,
  APP_SECRET: process.env.APP_SECRET,
};

export default config;
