import * as Joi from "joi";

export const envValidationSchema = Joi.object({
  PORT_NUMBER: Joi.number().default(3000),
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),

  DATABASE_NAME: Joi.string().required(),
  DATABASE_USER: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required().min(8),
  DATABASE_HOST: Joi.string().default("localhost"),
  DATABASE_PORT: Joi.number().default(5432),

  JWT_SECRET: Joi.string().required().min(32),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default("30d"),

  // Para criptografia em repouso (deve ser 64 chars hex = 32 bytes)
  ENCRYPTION_KEY: Joi.string().required().length(64).hex(),

  ENABLE_HTTPS: Joi.boolean().default(false),
  SSL_CERT_PATH: Joi.string().when("ENABLE_HTTPS", {
    is: true,
    then: Joi.required(),
  }),
  SSL_KEY_PATH: Joi.string().when("ENABLE_HTTPS", {
    is: true,
    then: Joi.required(),
  }),

  CORS_ORIGIN: Joi.string().default("http://localhost:3000"),
  CORS_CREDENTIALS: Joi.boolean().default(true),
});

export function validateEnv(config: Record<string, unknown>) {
  const { error, value } = envValidationSchema.validate(config, {
    abortEarly: false,
    allowUnknown: true,
  });

  if (error) {
    const errors = error.details.map((d) => d.message).join(", ");
    throw new Error(`Erro de validação de variáveis de ambiente: ${errors}`);
  }

  return value;
}
