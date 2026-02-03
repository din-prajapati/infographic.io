import { IsString, IsNumber, IsArray, IsOptional, IsEnum, ValidateNested, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class AgentBrandingDto {
  @ApiProperty({ example: 'Jane Smith' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'ABC Realty' })
  @IsString()
  brokerage: string;

  @ApiProperty({ example: ['#1F448B', '#FFFFFF'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  brandColors: string[];

  @ApiProperty({ example: 'https://example.com/logo.png', required: false })
  @IsString()
  @IsOptional()
  logoUrl?: string;
}

export class GenerateInfographicDto {
  @ApiProperty({ example: 'residential', enum: ['residential', 'commercial', 'land'] })
  @IsEnum(['residential', 'commercial', 'land'])
  propertyType: string;

  @ApiProperty({ example: 'for_sale', enum: ['for_sale', 'for_rent', 'sold'] })
  @IsEnum(['for_sale', 'for_rent', 'sold'])
  listingType: string;

  @ApiProperty({ example: 450000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: '123 Main St, Austin, TX 78701' })
  @IsString()
  address: string;

  @ApiProperty({ example: 3 })
  @IsNumber()
  @Min(0)
  beds: number;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(0)
  baths: number;

  @ApiProperty({ example: 1800 })
  @IsNumber()
  @Min(0)
  sqft: number;

  @ApiProperty({ example: ['pool', 'updated_kitchen', 'hardwood_floors'], type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[];

  @ApiProperty({ example: ['https://example.com/photo1.jpg'], type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  photos?: string[];

  @ApiProperty({ type: AgentBrandingDto })
  @ValidateNested()
  @Type(() => AgentBrandingDto)
  agent: AgentBrandingDto;

  @ApiProperty({ example: 'ideogram-turbo', enum: ['ideogram-turbo', 'ideogram-2'], required: false })
  @IsEnum(['ideogram-turbo', 'ideogram-2'])
  @IsOptional()
  aiModel?: string;
}
