import { Module } from '@nestjs/common';
import { OpenAiService } from './services/openai.service';
import { IdeogramService } from './services/ideogram.service';
import { AiOrchestrator } from './services/ai-orchestrator.service';

@Module({
  providers: [OpenAiService, IdeogramService, AiOrchestrator],
  exports: [AiOrchestrator, OpenAiService, IdeogramService],
})
export class AiGenerationModule {}
