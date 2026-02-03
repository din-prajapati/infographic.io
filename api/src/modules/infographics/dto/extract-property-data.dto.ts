import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ExtractPropertyDataDto {
  @ApiProperty({ 
    example: '3BR house in Austin for $450k with pool and updated kitchen',
    description: 'Natural language prompt describing the property'
  })
  @IsString()
  prompt: string;

  @ApiProperty({ 
    example: 'conv_123',
    description: 'Optional conversation ID for context',
    required: false
  })
  @IsString()
  @IsOptional()
  conversationId?: string;

  @ApiProperty({
    example: [
      { role: 'user', content: 'I need an infographic for a property' },
      { role: 'assistant', content: 'Sure! What are the details?' }
    ],
    description: 'Previous conversation messages for context',
    required: false
  })
  @IsArray()
  @IsOptional()
  context?: Array<{ role: string; content: string }>;
}

