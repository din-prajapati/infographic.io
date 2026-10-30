import { IsString, IsOptional, IsInt, IsArray, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Ownership fields (id, organizationId, createdAt, updatedAt) are deliberately absent:
 * ValidatedBody's forbidNonWhitelisted rejects them, and organizationId always comes from req.user.
 */
export class CreatePropertyDto {
  @ApiProperty({ description: 'Property type', required: false, default: 'residential' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ description: 'Listing headline', required: false })
  @IsString()
  @IsOptional()
  headline?: string;

  @ApiProperty({ description: 'Display price (free text)', required: false })
  @IsString()
  @IsOptional()
  price?: string;

  @ApiProperty({ description: 'Bedrooms', required: false, minimum: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  beds?: number;

  @ApiProperty({ description: 'Bathrooms', required: false, minimum: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  baths?: number;

  @ApiProperty({ description: 'Area (free text)', required: false })
  @IsString()
  @IsOptional()
  sqft?: string;

  @ApiProperty({ description: 'Address', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ description: 'Description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Features', required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[];

  @ApiProperty({ description: 'Locale', required: false })
  @IsString()
  @IsOptional()
  locale?: string;

  @ApiProperty({ description: 'Photo references', required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  photoRefs?: string[];

  @ApiProperty({ description: 'Status', required: false, default: 'active' })
  @IsString()
  @IsOptional()
  status?: string;
}
