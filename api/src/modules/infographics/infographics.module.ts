import { Module, forwardRef } from '@nestjs/common';
import { InfographicsController } from './controllers/infographics.controller';
import { GenerationsController } from './controllers/generations.controller';
import { ExtractionsController } from './controllers/extractions.controller';
import { InfographicsService } from './services/infographics.service';
import { GenerationsService } from './services/generations.service';
import { PromptExtractorService } from './services/prompt-extractor.service';
import { UsageAlertService } from './services/usage-alert.service';
import { GenerationProgressGateway } from './gateways/generation-progress.gateway';
import { AiGenerationModule } from '../ai-generation/ai-generation.module';
import { TemplatesModule} from '../templates/templates.module';

@Module({
  imports: [AiGenerationModule, TemplatesModule],
  controllers: [
    InfographicsController,
    GenerationsController,
    ExtractionsController,
  ],
  providers: [
    InfographicsService,
    GenerationsService,
    PromptExtractorService,
    UsageAlertService,
    GenerationProgressGateway,
  ],
  exports: [InfographicsService, GenerationsService, PromptExtractorService, UsageAlertService, GenerationProgressGateway],
})
export class InfographicsModule {}
