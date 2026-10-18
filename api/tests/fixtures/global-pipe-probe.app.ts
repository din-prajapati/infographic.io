/**
 * Fixture for `production-loader.spec.ts`. Not a test — it is *launched by* that test as a child
 * process under the same loader production uses (`ts-node`), and probed over HTTP.
 *
 * Deliberately minimal: no DatabaseModule, no ConfigModule, no env validation. CI has no
 * `DATABASE_URL` and `env.validation.ts` requires 7 keys, so booting the real AppModule here
 * would fail for reasons unrelated to what is being measured. The only question this answers is:
 *
 *     under the real loader, does the GLOBAL ValidationPipe resolve a DTO from a plain @Body()?
 *
 * The pipe config below must stay identical to `api/src/main.ts`.
 *
 * Prints `READY <port>` on stdout once listening, so the spec need not guess a free port.
 */
import 'reflect-metadata';
import { Body, Controller, Get, HttpCode, Module, Post, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { IsString, MinLength } from 'class-validator';

class ProbeDto {
  @IsString()
  @MinLength(1)
  token: string;
}

@Controller('probe')
class ProbeController {
  /** Plain @Body() — relies entirely on the global pipe, exactly as every route did before BL-30. */
  @Post('body')
  @HttpCode(200)
  body(@Body() dto: ProbeDto) {
    return { token: dto.token, type: typeof dto.token };
  }

  /** Reports whether the loader emitted decorator metadata at all. */
  @Get('metadata')
  metadata() {
    const paramtypes = Reflect.getMetadata('design:paramtypes', ProbeController.prototype, 'body');
    return {
      hasMetadata: Array.isArray(paramtypes) && paramtypes[0] === ProbeDto,
      resolved: Array.isArray(paramtypes) ? (paramtypes[0]?.name ?? null) : null,
    };
  }
}

@Module({ controllers: [ProbeController] })
class ProbeModule {}

async function bootstrap() {
  const app = await NestFactory.create(ProbeModule, { logger: false });
  // Must match api/src/main.ts
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  await app.listen(0);
  const url = await app.getUrl();
  const port = new URL(url.replace('[::1]', '127.0.0.1')).port;
  // eslint-disable-next-line no-console
  console.log(`READY ${port}`);
}

void bootstrap();
