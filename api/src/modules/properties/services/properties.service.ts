import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '../../../database/prisma.client';
import { CreatePropertyDto } from '../dto/create-property.dto';
import { UpdatePropertyDto } from '../dto/update-property.dto';

const PROPERTY_FIELDS = [
  'type',
  'headline',
  'price',
  'beds',
  'baths',
  'sqft',
  'address',
  'description',
  'features',
  'locale',
  'photoRefs',
  'status',
] as const;

type PropertyFields = Pick<CreatePropertyDto, (typeof PROPERTY_FIELDS)[number]>;

// Allow-list copy so ownership fields can never reach Prisma even if a caller bypasses the DTO.
function pickFields(dto: CreatePropertyDto | UpdatePropertyDto): PropertyFields {
  const data: Record<string, unknown> = {};
  for (const key of PROPERTY_FIELDS) {
    if (dto[key] !== undefined) data[key] = dto[key];
  }
  return data as PropertyFields;
}

@Injectable()
export class PropertiesService {
  async create(organizationId: string, dto: CreatePropertyDto) {
    return prisma.property.create({
      data: { ...pickFields(dto), organizationId },
    });
  }

  async findAll(organizationId: string) {
    return prisma.property.findMany({
      where: { organizationId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const property = await prisma.property.findFirst({
      where: { id, organizationId },
    });

    // Same message for missing and other-org ids so existence is not leaked.
    if (!property) {
      throw new NotFoundException(`Property ${id} not found`);
    }

    return property;
  }

  async update(id: string, organizationId: string, dto: UpdatePropertyDto) {
    await this.findOne(id, organizationId);

    return prisma.property.update({
      where: { id },
      data: pickFields(dto),
    });
  }
}
