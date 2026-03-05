export default () => ({
  port: parseInt(process.env.PORT_NUMBER, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",

  database: {
    name: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    host: process.env.DATABASE_HOST || "localhost",
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  },

  encryption: {
    key: process.env.ENCRYPTION_KEY,
  },

  https: {
    enabled: process.env.ENABLE_HTTPS === "true",
    certPath: process.env.SSL_CERT_PATH,
    keyPath: process.env.SSL_KEY_PATH,
  },

  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: process.env.CORS_CREDENTIALS !== "false",
  },
});
