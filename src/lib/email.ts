import "server-only";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}

// Dev-only adapter: logs instead of sending. Swap for Resend once that
// account exists — same `send()` signature, branch on process.env.RESEND_API_KEY.
class ConsoleEmailSender implements EmailSender {
  async send(message: EmailMessage): Promise<void> {
    console.log(
      `\n[email:dev] to=${message.to} subject="${message.subject}"\n${message.html}\n`,
    );
  }
}

export const emailSender: EmailSender = new ConsoleEmailSender();
