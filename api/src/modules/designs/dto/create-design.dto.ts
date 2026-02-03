import { IsString, IsOptional, IsObject, IsArray } from 'class-validator';
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
}

