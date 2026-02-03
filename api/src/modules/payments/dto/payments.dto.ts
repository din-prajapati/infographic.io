import { IsEnum, IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlanTier } from '@prisma/client';

export class CreateSubscriptionDto {
  @ApiProperty({ enum: PlanTier, description: 'Plan tier to subscribe to' })
  @IsEnum(PlanTier)
  planTier: PlanTier;

  @ApiPropertyOptional({ default: 'INR', description: 'Currency code' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'User region code (e.g., IN, US)' })
  @IsString()
  @IsOptional()
  region?: string;

  @ApiPropertyOptional({ description: 'Success redirect URL' })
  @IsString()
  @IsOptional()
  successUrl?: string;

  @ApiPropertyOptional({ description: 'Cancel redirect URL' })
  @IsString()
  @IsOptional()
  cancelUrl?: string;

  @ApiPropertyOptional({ description: 'Billing period: monthly or annual' })
  @IsString()
  @IsOptional()
  billingPeriod?: 'monthly' | 'annual';
}

export class CancelSubscriptionDto {
  @ApiPropertyOptional({ default: false, description: 'Cancel immediately vs at period end' })
  @IsBoolean()
  @IsOptional()
  immediate?: boolean;
}

export class VerifyPaymentDto {
  @ApiProperty({ description: 'RazorPay payment ID' })
  @IsString()
  razorpayPaymentId: string;

  @ApiProperty({ description: 'RazorPay subscription ID' })
  @IsString()
  razorpaySubscriptionId: string;

  @ApiProperty({ description: 'RazorPay signature' })
  @IsString()
  razorpaySignature: string;
}

export class UpdatePlanDto {
  @ApiProperty({ enum: PlanTier, description: 'New plan tier' })
  @IsEnum(PlanTier)
  planTier: PlanTier;
}

export class InternalWebhookDto {
  @ApiProperty({ description: 'Payment provider name' })
  @IsString()
  provider: string;

  @ApiProperty({ description: 'Webhook event data' })
  event: any;
}
