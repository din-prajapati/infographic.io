import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConversationDto {
  @ApiProperty({ example: 'Property Listing Discussion' })
  @IsString()
  title: string;

  @ApiProperty({ 
    example: 'residential',
    enum: ['residential', 'commercial', 'luxury', 'land'],
    required: false
  })
  @IsEnum(['residential', 'commercial', 'luxury', 'land'])
  @IsOptional()
  propertyType?: 'residential' | 'commercial' | 'luxury' | 'land';

  @ApiProperty({ 
    example: 'mid',
    enum: ['low', 'mid', 'high', 'luxury'],
    required: false
  })
  @IsEnum(['low', 'mid', 'high', 'luxury'])
  @IsOptional()
  priceRange?: 'low' | 'mid' | 'high' | 'luxury';
}

export class UpdateConversationDto {
  @ApiProperty({ example: 'Updated Title', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isFavorite?: boolean;
}

export class AddMessageDto {
  @ApiProperty({ example: '3BR house in Austin for $450k' })
  @IsString()
  content: string;

  @ApiProperty({ example: 'user', enum: ['user', 'ai'] })
  @IsEnum(['user', 'ai'])
  type: 'user' | 'ai';
}

