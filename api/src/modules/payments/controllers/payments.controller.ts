import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
  Inject,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

const DEBUG_LOG_PATH = path.join(__dirname, '../../../../..', '.cursor', 'debug.log');
function debugLog(location: string, message: string, data: Record<string, unknown>) {
  try {
    fs.appendFileSync(DEBUG_LOG_PATH, JSON.stringify({ location, message, data, timestamp: Date.now() }) + '\n');
  } catch (_) {}
}
import { ApiTags, ApiOperation, ApiBearerAuth, ApiSecurity, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PaymentsService } from '../services/payments.service';
import {
  CreateSubscriptionDto,
  CancelSubscriptionDto,
  VerifyPaymentDto,
  UpdatePlanDto,
  InternalWebhookDto,
} from '../dto/payments.dto';
import { PlanTier } from '@prisma/client';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(@Inject(PaymentsService) private readonly paymentsService: PaymentsService) {}

  @Get('provider-info')
  @ApiOperation({ summary: 'Get payment provider configuration for frontend' })
  @ApiQuery({ name: 'currency', required: false, description: 'Currency code (e.g., INR, USD)' })
  @ApiQuery({ name: 'region', required: false, description: 'Region code (e.g., IN, US)' })
  async getProviderInfo(@Query('currency') currency?: string, @Query('region') region?: string) {
    return this.paymentsService.getProviderInfo(currency, region);
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get all available subscription plans' })
  getPlans() {
    return { plans: this.paymentsService.getAvailablePlans() };
  }

  @Post('create-subscription')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new subscription for authenticated user' })
  async createSubscription(@Body() dto: CreateSubscriptionDto, @Req() req: any) {
    const userId = req.user.id;
    try {
      const result = await this.paymentsService.createSubscription(
        userId,
        dto.planTier,
        dto.currency || 'INR',
        dto.region,
        dto.successUrl,
        dto.cancelUrl,
        dto.billingPeriod || 'monthly',
      );
      return {
        success: true,
        subscription: result.subscription,
        provider: result.provider,
        shortUrl: result.shortUrl,
        checkoutUrl: result.checkoutUrl,
      };
    } catch (err: any) {
      // #region agent log
      const safeErrPayload: Record<string, unknown> = {
        errorMessage: err?.message,
        errorName: err?.name,
        errorStack: err?.stack?.slice(0, 800),
        responseMessage: err?.response?.message,
        errorDescription: err?.error?.description ?? err?.description,
      };
      if (err?.response?.data && typeof err.response.data === 'object') {
        safeErrPayload.responseData = err.response.data;
      }
      if (err?.code) safeErrPayload.code = err.code;
      if (err?.statusCode) safeErrPayload.statusCode = err.statusCode;
      try {
        fetch('http://127.0.0.1:7244/ingest/8efc90dd-6123-4218-ac73-6942740927b9', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'PaymentsController.createSubscription',
            message: 'create-subscription failed',
            data: safeErrPayload,
            timestamp: Date.now(),
            sessionId: 'debug-session',
            hypothesisId: 'A',
          }),
        }).catch(() => {});
      } catch (_) {}
      debugLog('PaymentsController.createSubscription', 'create-subscription failed', safeErrPayload);
      // #endregion
      let logMessage: string;
      try {
        logMessage =
          err?.message ??
          err?.response?.message ??
          err?.error?.description ??
          err?.description ??
          (typeof err === 'object' && err !== null ? JSON.stringify(err).slice(0, 500) : String(err)) ??
          'Unknown error';
      } catch {
        logMessage = 'Unknown error (serialization failed)';
      }
      this.logger.error('create-subscription failed', err?.stack ?? logMessage);
      if (err instanceof NotFoundException || err instanceof BadRequestException) {
        throw err;
      }
      const message =
        err?.message ??
        err?.response?.message ??
        err?.error?.description ??
        err?.description ??
        'Failed to create subscription';
      throw new InternalServerErrorException(message);
    }
  }

  @Get('subscription')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current subscription for authenticated user' })
  async getSubscription(@Req() req: any) {
    const userId = req.user.id;
    const subscription = await this.paymentsService.getCurrentSubscription(userId);
    return { subscription };
  }

  @Post('update-plan')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upgrade/downgrade subscription plan' })
  async updatePlan(@Body() dto: UpdatePlanDto, @Req() req: any) {
    const userId = req.user.id;
    const subscription = await this.paymentsService.updateSubscriptionPlan(userId, dto.planTier);
    return { success: true, subscription };
  }

  @Post('cancel')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel current subscription' })
  async cancelSubscription(@Body() dto: CancelSubscriptionDto, @Req() req: any) {
    const userId = req.user.id;
    const subscription = await this.paymentsService.cancelSubscription(userId, dto.immediate || false);
    return { success: true, subscription };
  }

  @Get('history')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment history for authenticated user' })
  async getPaymentHistory(@Req() req: any) {
    const userId = req.user.id;
    const payments = await this.paymentsService.getPaymentHistory(userId);
    return { payments };
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify RazorPay payment signature' })
  async verifyPayment(@Body() dto: VerifyPaymentDto) {
    const isValid = await this.paymentsService.verifyPayment(
      dto.razorpayPaymentId,
      dto.razorpaySubscriptionId,
      dto.razorpaySignature,
    );
    return { success: isValid, verified: isValid };
  }

  @Post('webhooks/internal')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Internal webhook endpoint (called from Express webhook routes)' })
  async handleInternalWebhook(@Body() dto: InternalWebhookDto, @Req() req: any) {
    // Verify internal request header
    const internalHeader = req.headers['x-internal-request'];
    if (internalHeader !== 'true') {
      return { error: 'Unauthorized' };
    }

    const { provider, event } = dto;
    const providerType = provider.toUpperCase() as 'RAZORPAY' | 'STRIPE' | 'PADDLE' | 'PAYPAL';

    // Map provider-specific event names to internal event format
    let internalEvent = event.event || event.type;
    if (providerType === 'STRIPE') {
      const stripeEventMap: Record<string, string> = {
        'customer.subscription.created': 'subscription.activated',
        'customer.subscription.updated': 'subscription.activated',
        'invoice.payment_succeeded': 'subscription.charged',
        'invoice.paid': 'subscription.charged',
        'customer.subscription.deleted': 'subscription.cancelled',
        'invoice.payment_failed': 'payment.failed',
      };
      internalEvent = stripeEventMap[event.type] || event.type;
    }

    console.log(`Webhook received from ${providerType}:`, event.type || event.event, `-> ${internalEvent}`);

    // Handle events based on internal event type
    switch (internalEvent) {
      case 'subscription.activated':
        await this.paymentsService.handleSubscriptionActivated(event, providerType);
        break;
      case 'subscription.charged':
        await this.paymentsService.handleSubscriptionCharged(event, providerType);
        break;
      case 'subscription.cancelled':
        await this.paymentsService.handleSubscriptionCancelled(event, providerType);
        break;
      case 'payment.failed':
        await this.paymentsService.handlePaymentFailed(event, providerType);
        break;
      default:
        console.log(`Unhandled webhook event: ${internalEvent}`);
    }

    return {
      status: 'ok',
      provider: providerType,
      event: event.event || event.type,
    };
  }
}
