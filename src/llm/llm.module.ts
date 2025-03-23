import { Module } from '@nestjs/common';
import { LlmService } from './llm.service';

@Module({
  controllers: [],
  providers: [LlmService],
})
export class LlmModule {}
