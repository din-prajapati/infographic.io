import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { prisma } from '../../../database/prisma.client';
import { REAL_ESTATE_TEMPLATES } from '../data/templates.data';

@Injectable()
export class TemplatesService implements OnModuleInit {
  async onModuleInit() {
    await this.seedTemplates();
  }

  private async seedTemplates() {
    try {
      const count = await prisma.template.count();
      if (count === 0) {
        await prisma.template.createMany({
          data: REAL_ESTATE_TEMPLATES,
        });
        console.log('✅ Seeded 5 Real Estate templates');
      }
    } catch (error) {
      console.log('⏭️  Template seeding skipped (already seeded via SQL)');
    }
  }

  async findAll() {
    return prisma.template.findMany({
      where: { isActive: true },
      orderBy: { category: 'asc' },
    });
  }

  async findOne(id: string) {
    const template = await prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException(`Template ${id} not found`);
    }

    return template;
  }

  async selectBestTemplate(propertyData: any): Promise<string> {
    const { propertyType, listingType, price } = propertyData;

    let category = 'listing';
    let priceRange = 'any';

    if (listingType === 'sold') {
      category = 'sold';
    } else if (listingType === 'open_house') {
      category = 'open_house';
    }

    if (price >= 1000000) {
      priceRange = 'luxury';
    } else if (price >= 500000) {
      priceRange = 'mid';
    } else if (price < 500000) {
      priceRange = 'starter';
    }

    const template = await prisma.template.findFirst({
      where: {
        category,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!template) {
      const fallback = await this.findAll();
      return fallback[0]?.id;
    }

    return template.id;
  }
}
