import { IsString, IsInt, IsArray, Min, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Ownership fields (id, organizationId, createdAt, updatedAt) are deliberately absent:
 * ValidatedBody's forbidNonWhitelisted rejects them, and organizationId always comes from req.user.
 *
 * Fields are optional only when omitted: ValidateIf (not IsOptional) means an explicit null is a 400,
 * not a null written into a non-nullable column.
 */
export class CreatePropertyDto {
  @ApiProperty({ description: 'Property type', required: false, default: 'residential' })
  @IsString()
  @ValidateIf((_, value) => value !== undefined)
  type?: string;

  @ApiProperty({ description: 'Listing headline', required: false })
  @IsString()
  @ValidateIf((_, value) => value !== undefined)
  headline?: string;

  @ApiProperty({ description: 'Display price (free text)', required: false })
  @IsString()
  @ValidateIf((_, value) => value !== undefined)
  price?: string;

  @ApiProperty({ description: 'Bedrooms', required: false, minimum: 0 })
  @IsInt()
  @Min(0)
  @ValidateIf((_, value) => value !== undefined)
  beds?: number;

  @ApiProperty({ description: 'Bathrooms', required: false, minimum: 0 })
  @IsInt()
  @Min(0)
  @ValidateIf((_, value) => value !== undefined)
  baths?: number;

  @ApiProperty({ description: 'Area (free text)', required: false })
  @IsString()
  @ValidateIf((_, value) => value !== undefined)
  sqft?: string;

  @ApiProperty({ description: 'Address', required: false })
  @IsString()
  @ValidateIf((_, value) => value !== undefined)
  address?: string;

  @ApiProperty({ description: 'Description', required: false })
  @IsString()
  @ValidateIf((_, value) => value !== undefined)
  description?: string;

  @ApiProperty({ description: 'Features', required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @ValidateIf((_, value) => value !== undefined)
  features?: string[];

  @ApiProperty({ description: 'Locale', required: false })
  @IsString()
  @ValidateIf((_, value) => value !== undefined)
  locale?: string;

  @ApiProperty({ description: 'Photo references', required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @ValidateIf((_, value) => value !== undefined)
  photoRefs?: string[];

  @ApiProperty({ description: 'Status', required: false, default: 'active' })
  @IsString()
  @ValidateIf((_, value) => value !== undefined)
  status?: string;
}
