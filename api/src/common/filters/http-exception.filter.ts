import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

const DEBUG_LOG_PATH = path.join(__dirname, '../../../../..', '.cursor', 'debug.log');
function debugLog(location: string, message: string, data: Record<string, unknown>) {
  try {
    fs.appendFileSync(
      DEBUG_LOG_PATH,
      JSON.stringify({ location, message, data, timestamp: Date.now() }) + '\n',
    );
  } catch (_) {}
}

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

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string;
    if (isHttpException) {
      const res = exception.getResponse();
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

    // Runtime evidence: write every exception to debug.log for diagnosis
    debugLog('AllExceptionsFilter.catch', 'exception captured', {
      status,
      message: message || 'Internal server error',
      isHttpException,
      errorName: exception instanceof Error ? exception.name : undefined,
      stack: exception instanceof Error ? exception.stack?.slice(0, 800) : undefined,
    });

    response.status(status).json({
      statusCode: status,
      message: message || 'Internal server error',
    });
  }
}
