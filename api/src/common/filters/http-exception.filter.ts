import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Catches all exceptions. For non-HttpException (e.g. from Prisma, Razorpay),
 * Nest's default filter returns 500 "Internal server error" and hides the real message.
 * This filter returns the actual error message so clients and logs see the cause.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Use duck typing to detect HttpException (avoids instanceof issues with multiple module instances)
    const isHttpException = exception instanceof HttpException ||
      (exception !== null && typeof exception === 'object' &&
       typeof (exception as any).getStatus === 'function' &&
       typeof (exception as any).getResponse === 'function');

    const status = isHttpException
      ? (exception as HttpException).getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string;
    if (isHttpException) {
      const res = (exception as HttpException).getResponse();
      message = typeof res === 'object' && res !== null && 'message' in res
        ? (Array.isArray((res as any).message) ? (res as any).message[0] : (res as any).message)
        : String(res);
    } else {
      message = exception instanceof Error
        ? exception.message
        : String(exception);
      this.logger.error(
        `Unhandled exception: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json({
      statusCode: status,
      message: message || 'Internal server error',
    });
  }
}
