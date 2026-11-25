import { IsInt, IsObject, Min } from 'class-validator';

export class CreatePropertyDto {
  @IsObject()
  record: object;
}
export class UpdatePropertyDto extends CreatePropertyDto {
  @IsInt()
  @Min(1)
  expectedVersion: number;
}
export class SaveListingProfileDto {
  @IsObject()
  record: object;
  @IsInt()
  @Min(0)
  expectedVersion: number;
}
