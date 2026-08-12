import { Module } from '@nestjs/common';
import { OpenAiService } from './services/openai.service';
import { IdeogramService } from './services/ideogram.service';
import { AiOrchestrator } from './services/ai-orchestrator.service';
import { LayerExtractionService } from './services/layer-extraction.service';
import { LayoutPlannerService } from './services/layout-planner.service';

@Module({
  providers: [OpenAiService, IdeogramService, AiOrchestrator, LayerExtractionService, LayoutPlannerService],
  exports: [AiOrchestrator, OpenAiService, IdeogramService, LayerExtractionService, LayoutPlannerService],
})
export class AiGenerationModule {}
