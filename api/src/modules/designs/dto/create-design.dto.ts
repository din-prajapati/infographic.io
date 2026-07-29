import { IsString, IsOptional, IsObject, IsArray, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDesignDto {
  @ApiProperty({ description: 'Design name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Design type', enum: ['design', 'template'] })
  @IsString()
  type: 'design' | 'template';

  @ApiProperty({ description: 'Category', required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ description: 'Thumbnail (base64)', required: false })
  @IsString()
  @IsOptional()
  thumbnail?: string;

  @ApiProperty({ description: 'Canvas data (JSON)' })
  @IsObject()
  canvasData: any;

  @ApiProperty({ description: 'Tags', required: false, type: [String] })
  @IsArray()
  @IsOptional()
  tags?: string[];

  /**
   * Template visibility. Reserved-for-future values: 'admin_curated', 'for_sale'.
   * Only 'private' has a reachable UI path (user-saved templates).
   * 'admin_curated' rows are created exclusively by the seed-premium-templates script.
   */
  @ApiProperty({
    description: "Template visibility ('private' | 'admin_curated' | 'for_sale')",
    enum: ['private', 'admin_curated', 'for_sale'],
    required: false,
  })
  @IsIn(['private', 'admin_curated', 'for_sale'])
  @IsOptional()
  visibility?: 'private' | 'admin_curated' | 'for_sale';
}

