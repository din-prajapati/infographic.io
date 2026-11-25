import { BadRequestException, Controller, FileTypeValidator, HttpStatus, Inject, Logger, MaxFileSizeValidator, ParseFilePipe, Post, Req, ServiceUnavailableException, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { StorageService } from '../services/storage.service';

/** 10 MB matches the existing listing upload ceiling in the V3 editor. */
export const MEDIA_MAX_BYTES = 10 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif' };

interface MediaRequest { user: { id: string; organizationId?: string | null } }
interface UploadedMedia { buffer: Buffer; mimetype: string; size: number; originalname?: string }

/**
 * Durable storage for images placed in V3 designs, templates and listings (listing photos, agent portraits, brand
 * logos, replaced images). Files go to the Cloudflare R2 bucket and the record stores only the public https URL,
 * so design/template/property JSON stays small. Keys are scoped by organization (or user when no organization).
 * The bucket is public-read (see StorageService.download); canvas export reaches it through /api/proxy-image.
 */
@Controller('media')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class MediaController {
  private readonly logger = new Logger(MediaController.name);
  constructor(@Inject(StorageService) private readonly storage: StorageService) {}

  @Post()
  // Tighter than the global 100/min: each call writes an R2 object that is never deleted automatically.
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Upload an image for V3 designs/listings to R2 (max 10 MB; JPEG, PNG, WebP, GIF or AVIF)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MEDIA_MAX_BYTES, files: 1 } }))
  async upload(
    @Req() req: MediaRequest,
    @UploadedFile(new ParseFilePipe({
      validators: [
        new MaxFileSizeValidator({ maxSize: MEDIA_MAX_BYTES, message: 'Choose an image smaller than 10 MB.' }),
        // Nest 11 checks the file's magic bytes, not only the declared type.
        new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp|gif|avif)$/ }),
      ],
      errorHttpStatusCode: HttpStatus.BAD_REQUEST,
      exceptionFactory: (error: string) => new BadRequestException(/size/i.test(error) ? 'Choose an image smaller than 10 MB.' : 'Choose a JPEG, PNG, WebP, GIF or AVIF image.'),
    })) file: UploadedMedia,
  ) {
    const extension = EXTENSIONS[file?.mimetype];
    if (!file || !extension) throw new BadRequestException('Choose a JPEG, PNG, WebP, GIF or AVIF image.');
    const owner = (req.user.organizationId || `user-${req.user.id}`).replace(/[^a-zA-Z0-9_-]/g, '');
    const key = `design-media/${owner}/${randomUUID()}.${extension}`;
    // Without a public base URL the stored object would be unreachable (and orphaned), so refuse before writing.
    if (!/^https:\/\//.test(process.env.R2_PUBLIC_URL ?? '')) throw new ServiceUnavailableException('Image storage is unavailable. Your design is unchanged; retry the upload.');
    try {
      await this.storage.upload(file.buffer, key, file.mimetype);
    } catch (error) {
      this.logger.warn(JSON.stringify({ event: 'media:r2-upload-failed', userId: req.user.id, key, error: error instanceof Error ? error.message : 'unknown' }));
      throw new ServiceUnavailableException('Image storage is unavailable. Your design is unchanged; retry the upload.');
    }
    this.logger.log(JSON.stringify({ event: 'media:uploaded', userId: req.user.id, key, sizeBytes: file.size, contentType: file.mimetype }));
    return { url: this.storage.getPublicUrl(key), key, contentType: file.mimetype, size: file.size };
  }
}
