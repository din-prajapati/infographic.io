import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface SendEmailParams {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export interface SendEmailResult {
  sent: boolean;
  /** true only in the no-key dev-fallback path */
  dev?: boolean;
}

/**
 * Provider-agnostic transactional email service.
 *
 * Routing logic:
 *   RESEND_API_KEY set   → send via Resend SDK using EMAIL_FROM address
 *   RESEND_API_KEY absent → log full message to console, resolve { sent: true, dev: true }
 *   Provider error        → catch, log, resolve { sent: false } — never throws to callers
 *
 * Callers import EmailService only — the Resend SDK is never referenced outside this module.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private client: Resend | null = null;
  private readonly apiKey: string | undefined;
  private readonly fromAddress: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('RESEND_API_KEY');
    this.fromAddress =
      this.config.get<string>('EMAIL_FROM') ?? 'noreply@example.com';

    if (this.apiKey) {
      this.client = new Resend(this.apiKey);
    }
  }

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    // Dev fallback — no API key configured (AC3)
    if (!this.client) {
      this.logger.log(
        `[DEV EMAIL] to=${params.to} subject="${params.subject}" ` +
          `body=${params.text ?? params.html ?? '(empty)'}`,
      );
      return { sent: true, dev: true };
    }

    try {
      await this.client.emails.send({
        from: this.fromAddress,
        to: params.to,
        subject: params.subject,
        ...(params.html !== undefined && { html: params.html }),
        ...(params.text !== undefined && { text: params.text }),
      });
      return { sent: true };
    } catch (err: unknown) {
      // Swallow errors — email must never break auth or webhook flows (AC4)
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Email delivery failed to=${params.to}: ${message}`,
        err instanceof Error ? err.stack : undefined,
      );
      return { sent: false };
    }
  }
}
