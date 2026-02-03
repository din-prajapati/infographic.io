import { Module } from '@nestjs/common';
import { DesignsController } from './controllers/designs.controller';
import { CanvasTemplatesController } from './controllers/canvas-templates.controller';
import { DesignsService } from './services/designs.service';

@Module({
  controllers: [DesignsController, CanvasTemplatesController],
  providers: [DesignsService],
  exports: [DesignsService],
})
export class DesignsModule {}

