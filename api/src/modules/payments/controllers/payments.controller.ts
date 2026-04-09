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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiSecurity, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PaymentsService } from '../services/payments.service';
import { UsageAnalyticsService } from '../services/usage-analytics.service';
import { PLAN_CONFIG } from '@shared/schema';
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

  constructor(
    @Inject(PaymentsService) private readonly paymentsService: PaymentsService,
    @Inject(UsageAnalyticsService) private readonly usageAnalyticsService: UsageAnalyticsService,
  ) {}

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
        providerSubscription: result.providerSubscription,
        shortUrl: result.shortUrl,
        checkoutUrl: result.checkoutUrl,
      };
    } catch (err: any) {
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
    const organizationId = req.user.organizationId || userId;
    const subscription = await this.paymentsService.getCurrentSubscription(userId);

    // Include monthly usage for billing display
    let usage: { current: number; limit: number } | undefined;
    try {
      const { count } = await this.usageAnalyticsService.getCurrentMonthUsage(userId, organizationId);
      const planTier = (subscription?.planTier || 'FREE') as keyof typeof PLAN_CONFIG;
      const planConfig = PLAN_CONFIG[planTier] || PLAN_CONFIG.FREE;
      usage = { current: count, limit: planConfig.limit };
    } catch {
      usage = undefined;
    }

    return { subscription, usage };
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

    this.logger.log(
      `Webhook received from ${providerType}: ${event.type || event.event} -> ${internalEvent}`,
    );

    // Handle events based on internal event type
    switch (internalEvent) {
      case 'subscription.activated':
      case 'subscription.authenticated': // RazorPay test mode: fired instead of subscription.activated
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
      case 'payment.authorized':
      case 'payment.captured':
        // Razorpay sends these for mandate / token flows (e.g. ₹5 card step). Billing truth is
        // subscription.charged (first invoice + ACTIVE + org); subscription.authenticated is logged only.
        this.logger.debug(`Webhook acknowledged: ${internalEvent} (no handler required)`);
        break;
      default:
        this.logger.log(`Unhandled webhook event: ${internalEvent}`);
    }

    return {
      status: 'ok',
      provider: providerType,
      event: event.event || event.type,
    };
  }
}
