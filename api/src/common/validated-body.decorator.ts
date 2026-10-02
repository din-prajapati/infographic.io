import {
  BadRequestException,
  ExecutionContext,
  createParamDecorator,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { ValidationError, validateSync } from 'class-validator';

/**
 * Validates a request body against an **explicitly named** DTO class.
 *
 * ## Why this exists instead of the global `ValidationPipe` (BL-30)
 *
 * The global pipe in `main.ts` is configured correctly but is **inert**: it resolves the DTO
 * class from `design:paramtypes`, and that metadata is never emitted. NestJS is started with
 * `npx tsx src/main.ts` (`server/index.ts`), tsx runs on esbuild, and esbuild does not implement
 * `emitDecoratorMetadata`. Measured under that runtime:
 *
 *     Reflect.getMetadata('design:paramtypes', Controller.prototype, 'handler')  ->  undefined
 *
 * With `metatype === undefined` the pipe returns the body untouched, so `@IsString()`,
 * `whitelist` and `forbidNonWhitelisted` all do nothing — on every route, in dev and in
 * production. `api/tsconfig.json` sets `emitDecoratorMetadata: true`, but `tsc` never runs the
 * serving code, so that flag is irrelevant.
 *
 * The root fix is to stop losing the metadata, which means resolving the repo's
 * `"type": "module"` (root `package.json`) vs `"module": "commonjs"` (`api/tsconfig.json`)
 * conflict that currently makes tsx the only loader able to run this code at all. That is a
 * module-system migration, tracked separately as BL-39.
 *
 * Passing the class explicitly needs no metadata, so validation works today and keeps working
 * after that migration.
 *
 * ## Use
 *
 *     async verifyEmail(@ValidatedBody(VerifyEmailDto) dto: VerifyEmailDto) { ... }
 *
 * Throws `400` with the same body shape `ValidationPipe` would produce, so clients see no
 * difference from a correctly-working global pipe.
 *
 * **Every property reachable through a DTO used here must carry a class-validator decorator.**
 * `forbidNonWhitelisted` rejects properties it does not know about, so a field with only
 * `@ApiProperty()` would make valid requests fail. `validated-body.spec.ts` asserts this
 * structurally for every DTO, because the failure is silent until a real request arrives.
 */
export const ValidatedBody = (dtoClass: new (...args: never[]) => object) =>
  createParamDecorator((cls: new (...args: never[]) => object, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const body = request?.body;

    // A JSON array or scalar would otherwise be silently coerced into a mostly-empty instance
    // and pass, so reject anything that is not a plain object up front.
    if (body === null || body === undefined || typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: ['request body must be a JSON object'],
      });
    }

    const instance = plainToInstance(cls, body);
    const errors = validateSync(instance, {
      whitelist: true,
      forbidNonWhitelisted: true,
      // Left off deliberately: with it on, class-validator rejects any instance whose class
      // carries no validation metadata at all, turning a decorator-less DTO into a blanket 400.
      forbidUnknownValues: false,
    });

    if (errors.length > 0) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: flattenValidationErrors(errors),
      });
    }

    return instance;
  })(dtoClass);

/** Mirrors ValidationPipe's flat `string[]` message, including nested property errors. */
function flattenValidationErrors(errors: ValidationError[], parent = ''): string[] {
  const messages: string[] = [];
  for (const error of errors) {
    const path = parent ? `${parent}.${error.property}` : error.property;
    if (error.constraints) {
      messages.push(...Object.values(error.constraints));
    }
    if (error.children?.length) {
      messages.push(...flattenValidationErrors(error.children, path));
    }
  }
  return messages;
}
