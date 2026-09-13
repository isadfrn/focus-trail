import { env } from "../env.js";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export function isEmailEnabled(): boolean {
  return env.EMAIL_ENABLED;
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  if (!env.EMAIL_ENABLED) {
    if (env.NODE_ENV !== "production" && env.NODE_ENV !== "test") {
      console.log(
        `[email:dev] to=${message.to} subject="${message.subject}"\n${message.text}`,
      );
    }
    return;
  }

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Resend request failed (${response.status}): ${detail}`);
  }
}
