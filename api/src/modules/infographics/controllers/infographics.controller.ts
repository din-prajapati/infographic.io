import {
  Controller, Post, Get, Body, Param, UseGuards, Req, Inject,
  UseInterceptors, UploadedFile, BadRequestException, ParseFilePipe,
  MaxFileSizeValidator, FileTypeValidator, HttpStatus, Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { randomUUID } from 'crypto';
import { InfographicsService } from '../services/infographics.service';
import { StorageService } from '../../storage/services/storage.service';
import { GenerateInfographicDto } from '../dto/generate-infographic.dto';

const PHOTO_UPLOADS_DIR = path.join(os.tmpdir(), 'ai-infographic-uploads');

@ApiTags('infographics')
@Controller('infographics')
export class InfographicsController {
  private readonly logger = new Logger(InfographicsController.name);

  constructor(
    @Inject(InfographicsService) private readonly infographicsService: InfographicsService,
    /** Optional for the same reason as elsewhere — existing specs construct with one argument. */
    @Inject(StorageService) private readonly storageService?: StorageService,
  ) {}

  @Post('upload-photo')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload a property photo for reference in generation (max 10 MB, JPG/PNG only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { photo: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('photo'))
  async uploadPhoto(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /image\/(jpeg|png)/ }),
        ],
        errorHttpStatusCode: HttpStatus.BAD_REQUEST,
      }),
    )
    file: any,
  ) {
    if (!file) {
      throw new BadRequestException('No photo file provided');
    }

    if (!fs.existsSync(PHOTO_UPLOADS_DIR)) {
      fs.mkdirSync(PHOTO_UPLOADS_DIR, { recursive: true });
    }

    const ext = file.mimetype === 'image/png' ? '.png' : '.jpg';
    const photoId = `${randomUUID()}${ext}`;
    const filePath = path.join(PHOTO_UPLOADS_DIR, photoId);

    // Local write stays. It is the fast path — upload and generation normally happen seconds
    // apart in the same container — and the fallback in readSourcePhoto() if R2 is unreachable.
    fs.writeFileSync(filePath, file.buffer);

    // US-INFRA-003 AC1 — the durable copy. The tmp dir does not survive a container restart, and
    // Railway restarts on every deploy AND every variable change. Without this, a generation
    // starting after such a restart fails with a 422 the customer can only fix by re-uploading.
    let durable = false;
    if (this.storageService) {
      try {
        await this.storageService.upload(
          file.buffer,
          `source-photos/${photoId}`,
          file.mimetype === 'image/png' ? 'image/png' : 'image/jpeg',
        );
        durable = true;
      } catch (err: any) {
        // Non-fatal: the local copy above already makes this photo usable for the common case.
        // Failing the upload request would be a worse outcome than a photo that is merely not
        // restart-proof.
        this.logger.warn(
          `{ "event": "photo:r2-upload-failed", "photoId": "${photoId}", "error": ${JSON.stringify(err?.message ?? 'unknown')} }`,
        );
      }
    }

    this.logger.log(
      `{ "event": "photo:uploaded", "photoId": "${photoId}", "sizeBytes": ${file.size}, "durable": ${durable} }`,
    );

    return { photoId, photoUrl: `/api/v1/infographics/photos/${photoId}` };
  }

  @Post('generate')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate infographic from property data' })
  async generate(@Body() dto: GenerateInfographicDto, @Req() req: any) {
    console.log('📝 [Controller] Received generate request');
    const userId = req.user.id;
    const organizationId = req.user.organizationId ?? null;
    console.log(`👤 User: ${userId}, Organization: ${organizationId ?? 'none (will create)'}`);
    const result = await this.infographicsService.generate(dto, userId, organizationId);
    console.log(`✅ [Controller] Generate endpoint returning: ${JSON.stringify(result)}`);
    return result;
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get infographic by ID' })
  async findOne(@Param('id') id: string) {
    return this.infographicsService.findOne(id);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user infographics' })
  async findAll(@Req() req: any) {
    const userId = req.user.id;
    return this.infographicsService.findByUser(userId);
  }
}
