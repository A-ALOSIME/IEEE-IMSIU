export type RuntimeEnv = Env & {
  RESEND_API_KEY?: string;
  RESEND_WEBHOOK_SECRET?: string;
  TURNSTILE_SECRET?: string;
};
