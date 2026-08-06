import { IsString, IsOptional, IsEnum, IsNumber, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AgentDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  brokerage?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  brandColors?: string[];
}
import { ApiProperty } from '@nestjs/swagger';

export class GenerateFromChatDto {
  @ApiProperty({ 
    example: '3BR house in Austin for $450k with pool',
    description: 'Natural language prompt describing the property'
  })
  @IsString()
  prompt: string;

  @ApiProperty({ 
    example: 'ext_123456789',
    description: 'Optional extraction ID if extraction was done separately',
    required: false
  })
  @IsString()
  @IsOptional()
  extractionId?: string;

  @ApiProperty({ 
    example: 'conv_123',
    description: 'Optional conversation ID',
    required: false
  })
  @IsString()
  @IsOptional()
  conversationId?: string;

  @ApiProperty({ 
    example: 'modern',
    description: 'Style preset name',
    required: false,
    enum: ['modern', 'classic', 'luxury', 'minimal', 'vibrant', 'professional']
  })
  @IsString()
  @IsOptional()
  style?: string;

  @ApiProperty({
    example: 'ideogram-turbo',
    description: 'AI model to use for image generation',
    required: false,
    enum: ['ideogram-turbo', 'ideogram-v2', 'nano-banana-pro', 'ideogram-3', 'ideogram-4']
  })
  @IsEnum(['ideogram-turbo', 'ideogram-v2', 'nano-banana-pro', 'ideogram-3', 'ideogram-4'])
  @IsOptional()
  model?: 'ideogram-turbo' | 'ideogram-v2' | 'nano-banana-pro' | 'ideogram-3' | 'ideogram-4';

  @ApiProperty({
    example: 'Stunning Hilltop Retreat',
    description: 'Optional headline text (max 35 chars). When provided the backend skips the LLM headline call.',
    required: false,
  })
  @IsString()
  @IsOptional()
  headline?: string;

  @ApiProperty({
    example: 'landscape',
    description: 'Infographic layout orientation',
    required: false,
    enum: ['landscape', 'portrait', 'square'],
    default: 'landscape',
  })
  @IsEnum(['landscape', 'portrait', 'square'])
  @IsOptional()
  orientation?: 'landscape' | 'portrait' | 'square';

  @ApiProperty({
    example: 3,
    description: 'Number of variations to generate (1-5)',
    required: false,
    default: 3
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  variations?: number;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg',
    description: 'Photo ID from a prior /infographics/upload-photo call; the image is used as a style reference in generation',
    required: false,
  })
  @IsString()
  @IsOptional()
  photoReference?: string;

  @ApiProperty({
    example: 'en-IN',
    description:
      'Output locale for on-image formatting (currency, numbering, area unit, room vocabulary). ' +
      'Resolved client-side because the currency symbol the user typed does not survive extraction. ' +
      'Omit for passthrough. Unrelated to billing currency.',
    required: false,
    enum: ['en-US', 'en-IN'],
  })
  @IsEnum(['en-US', 'en-IN'])
  @IsOptional()
  locale?: 'en-US' | 'en-IN';

  @ApiProperty({
    example: 'AED',
    description:
      'The currency token the user actually typed. Echoed verbatim when `locale` is absent or ' +
      'unrecognised, so an unsupported market still renders its own currency instead of "$".',
    required: false,
  })
  @IsString()
  @IsOptional()
  currencyToken?: string;

  @ValidateNested()
  @Type(() => AgentDto)
  @IsOptional()
  agent?: AgentDto;
}

export class RegenerateDto {
  @ApiProperty({ 
    example: ['add pool', 'make it more luxury'],
    description: 'List of modifications to apply',
    required: false
  })
  @IsOptional()
  modifications?: string[];

  @ApiProperty({ 
    example: 'luxury',
    description: 'New style preset',
    required: false
  })
  @IsString()
  @IsOptional()
  style?: string;
}

