import { createHmac } from "node:crypto";

export function unsubscribeToken(email: string): string {
  const secret = process.env.NEWSLETTER_UNSUBSCRIBE_SECRET;
  if (!secret || secret.length < 32) throw new Error("NEWSLETTER_UNSUBSCRIBE_SECRET em falta (mínimo 32 caracteres).");
  return createHmac("sha256", secret).update(email.toLowerCase()).digest("hex");
}
