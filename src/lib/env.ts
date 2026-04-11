const requiredEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

const requiredServerEnvVars = [
  ...requiredEnvVars,
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

function readEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export function getPublicEnv() {
  return {
    supabaseUrl: readEnv(requiredEnvVars[0]),
    supabaseAnonKey: readEnv(requiredEnvVars[1]),
  };
}

export function getServerEnv() {
  return {
    supabaseUrl: readEnv(requiredServerEnvVars[0]),
    supabaseAnonKey: readEnv(requiredServerEnvVars[1]),
    supabaseServiceRoleKey: readEnv(requiredServerEnvVars[2]),
    lineChannelSecret: process.env.LINE_CHANNEL_SECRET,
    lineChannelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  };
}

export function getEasySlipEnv() {
  return {
    apiKey: process.env.EASYSLIP_API_KEY ?? "",
  };
}

export function getStripeEnv() {
  return {
    secretKey: process.env.STRIPE_SECRET_KEY ?? "",
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
    priceIdMonthly: process.env.STRIPE_PRICE_ID_MONTHLY ?? "",
  };
}

export function getRequiredLineEnv() {
  return {
    lineChannelSecret: readEnv("LINE_CHANNEL_SECRET"),
    lineChannelAccessToken: readEnv("LINE_CHANNEL_ACCESS_TOKEN"),
  };
}
