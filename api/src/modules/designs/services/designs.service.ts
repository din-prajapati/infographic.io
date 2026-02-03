import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '../../../database/prisma.client';
import { CreateDesignDto } from '../dto/create-design.dto';

@Injectable()
export class DesignsService {
  /**
   * Create or update a design
   * Uses Infographic model to store canvas designs
   */
  async save(userId: string, organizationId: string, designDto: CreateDesignDto, designId?: string) {
    // Get or create a default template for canvas designs
    const defaultTemplate = await prisma.template.findFirst({
      where: { category: 'listing', isActive: true },
    });

    if (!defaultTemplate) {
      throw new BadRequestException('No default template found');
    }

    if (designId) {
      // Update existing design
      const existing = await prisma.infographic.findFirst({
        where: {
          id: designId,
          userId,
        },
      });

      if (!existing) {
        throw new NotFoundException(`Design ${designId} not found`);
      }

      const updated = await prisma.infographic.update({
        where: { id: designId },
        data: {
          propertyData: {
            ...(existing.propertyData as any || {}),
            canvasDesign: {
              name: designDto.name,
              type: designDto.type,
              category: designDto.category,
              thumbnail: designDto.thumbnail,
              canvasData: designDto.canvasData,
              tags: designDto.tags,
            },
          },
        },
      });

      const canvasDesign = (updated.propertyData as any)?.canvasDesign;
      return {
        id: updated.id,
        name: canvasDesign.name,
        type: canvasDesign.type || 'design',
        category: canvasDesign.category,
        thumbnail: canvasDesign.thumbnail,
        canvasData: canvasDesign.canvasData,
        tags: canvasDesign.tags,
        createdAt: updated.createdAt instanceof Date ? updated.createdAt.toISOString() : String(updated.createdAt),
        updatedAt: updated.updatedAt instanceof Date ? updated.updatedAt.toISOString() : String(updated.updatedAt),
      };
    } else {
      // Create new design
      const created = await prisma.infographic.create({
        data: {
          userId,
          organizationId,
          templateId: defaultTemplate.id,
          propertyData: {
            canvasDesign: {
              name: designDto.name,
              type: designDto.type,
              category: designDto.category,
              thumbnail: designDto.thumbnail,
              canvasData: designDto.canvasData,
              tags: designDto.tags,
            },
          },
          imageUrl: designDto.thumbnail || '',
          aiModel: 'canvas-editor',
          status: 'completed',
        },
      });

      const canvasDesign = (created.propertyData as any)?.canvasDesign;
      return {
        id: created.id,
        name: canvasDesign.name,
        type: canvasDesign.type || 'design',
        category: canvasDesign.category,
        thumbnail: canvasDesign.thumbnail,
        canvasData: canvasDesign.canvasData,
        tags: canvasDesign.tags,
        createdAt: created.createdAt instanceof Date ? created.createdAt.toISOString() : String(created.createdAt),
        updatedAt: created.updatedAt instanceof Date ? created.updatedAt.toISOString() : String(created.updatedAt),
      };
    }
  }

  /**
   * Get all designs for a user
   */
  async findAll(userId: string) {
    const infographics = await prisma.infographic.findMany({
      where: {
        userId,
        aiModel: 'canvas-editor',
      },
      orderBy: { createdAt: 'desc' },
    });

    const designs = infographics.map(inf => {
      const canvasDesign = (inf.propertyData as any)?.canvasDesign;
      if (!canvasDesign) return null;

      return {
        id: inf.id,
        name: canvasDesign.name,
        type: canvasDesign.type || 'design',
        category: canvasDesign.category,
        thumbnail: canvasDesign.thumbnail,
        canvasData: canvasDesign.canvasData,
        tags: canvasDesign.tags,
        createdAt: inf.createdAt instanceof Date ? inf.createdAt.toISOString() : String(inf.createdAt),
        updatedAt: inf.updatedAt instanceof Date ? inf.updatedAt.toISOString() : String(inf.updatedAt),
      };
    }).filter(Boolean);
    
    return designs;
  }

  /**
   * Get a design by ID
   */
  async findOne(id: string, userId: string) {
    const infographic = await prisma.infographic.findFirst({
      where: {
        id,
        userId,
        aiModel: 'canvas-editor',
      },
    });

    if (!infographic) {
      throw new NotFoundException(`Design ${id} not found`);
    }

    const canvasDesign = (infographic.propertyData as any)?.canvasDesign;
    if (!canvasDesign) {
      throw new NotFoundException(`Design ${id} has no canvas data`);
    }

    return {
      id: infographic.id,
      name: canvasDesign.name,
      type: canvasDesign.type || 'design',
      category: canvasDesign.category,
      thumbnail: canvasDesign.thumbnail,
      canvasData: canvasDesign.canvasData,
      tags: canvasDesign.tags,
      createdAt: infographic.createdAt instanceof Date ? infographic.createdAt.toISOString() : String(infographic.createdAt),
      updatedAt: infographic.updatedAt instanceof Date ? infographic.updatedAt.toISOString() : String(infographic.updatedAt),
    };
  }

  /**
   * Delete a design
   */
  async delete(id: string, userId: string) {
    const infographic = await prisma.infographic.findFirst({
      where: {
        id,
        userId,
        aiModel: 'canvas-editor',
      },
    });

    if (!infographic) {
      throw new NotFoundException(`Design ${id} not found`);
    }

    await prisma.infographic.delete({
      where: { id },
    });

    return { success: true };
  }
}

