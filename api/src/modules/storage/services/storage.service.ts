import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

/**
 * US-INFRA-001 — the single place this codebase talks to object storage.
 *
 * Cloudflare R2 speaks the S3 API, so `@aws-sdk/client-s3` is the client; the only R2-specific
 * parts are the endpoint (derived from the account id) and `region: 'auto'`, which R2 requires
 * because it has no regions in the AWS sense.
 *
 * ## Deliberately two methods
 *
 * `upload()` and `getPublicUrl()`. No `delete()`, no `list()` — both explicitly out of scope in
 * the story. That is not minimalism for its own sake: the R2 API tokens are scoped **Object Read
 * & Write**, so a `delete()` here would be a method that always throws in production. If a
 * reclaim job ever needs deletion it needs a differently-scoped token, and that is a decision to
 * take then rather than a capability to leave lying around.
 *
 * ## Why the client is lazy
 *
 * `getPublicUrl()` must work with no network and no credentials (AC2), and it is the method the
 * pricing/rendering paths would reach for. Constructing `S3Client` eagerly in the constructor
 * would make this service unconstructable in any environment where R2 is unprovisioned — which
 * is every environment today, since the human task only just completed. The client is built on
 * first `upload()` instead, so an unconfigured deployment fails at the point it actually tries
 * to store something, not at boot.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private client: S3Client | null = null;

  /** Built on first use — see the class doc on why this is not done in the constructor. */
  private getClient(): S3Client {
    if (this.client) return this.client;

    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    const missing = [
      !accountId && 'R2_ACCOUNT_ID',
      !accessKeyId && 'R2_ACCESS_KEY_ID',
      !secretAccessKey && 'R2_SECRET_ACCESS_KEY',
    ].filter(Boolean);

    if (missing.length > 0) {
      // Named explicitly rather than letting the SDK fail with a generic credentials error —
      // "R2 is not configured" is a much faster thing to read at 2am than "Resolved credential
      // object is not valid".
      throw new Error(
        `StorageService cannot upload: R2 is not configured (missing ${missing.join(', ')}). ` +
          `See docs/setup/CLOUDFLARE_R2_SETUP.md.`,
      );
    }

    this.client = new S3Client({
      // R2 has no regions; 'auto' is what Cloudflare's S3 compatibility layer expects.
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: accessKeyId as string, secretAccessKey: secretAccessKey as string },
    });
    return this.client;
  }

  /**
   * Store a buffer and return the permanent, Buildographic-owned URL it is served from.
   *
   * Re-throws on failure (AC3) rather than returning null or a sentinel. Callers decide what a
   * storage failure means for them — `US-INFRA-002` degrades to the provider's own URL rather
   * than failing a generation, and that is its decision to make, not this service's. A method
   * that silently swallowed the error would take that choice away and make the fallback
   * indistinguishable from success.
   */
  async upload(buffer: Buffer, key: string, contentType?: string): Promise<string> {
    const bucket = process.env.R2_BUCKET_NAME;
    if (!bucket) {
      throw new Error(
        'StorageService cannot upload: R2_BUCKET_NAME is not set. See docs/setup/CLOUDFLARE_R2_SETUP.md.',
      );
    }

    await this.getClient().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        // TC-INFRA-001-04: an absent contentType must not become `undefined` on the object —
        // R2 would serve it with no Content-Type and browsers would download rather than render.
        ContentType: contentType ?? 'application/octet-stream',
      }),
    );

    return this.getPublicUrl(key);
  }

  /**
   * The public URL an object key is served from. Synchronous, no network call (AC2) — it is
   * string concatenation against `R2_PUBLIC_URL`, which differs per environment (the production
   * custom domain, the staging r2.dev host).
   *
   * The trailing-slash strip is not decoration: `R2_PUBLIC_URL` is human-entered into an env
   * file, and a trailing slash would produce `//` in every asset URL the product emits.
   */
  getPublicUrl(key: string): string {
    const base = (process.env.R2_PUBLIC_URL ?? '').replace(/\/+$/, '');
    const cleanKey = key.replace(/^\/+/, '');
    return `${base}/${cleanKey}`;
  }
}
