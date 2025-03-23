import { Injectable } from '@nestjs/common';
import { createLLMProvider } from './providers/provider.factory';

@Injectable()
export class LlmService {
  async generateQuizQuestions(theme: string, numQuestions: number) {
    const llmProvider = createLLMProvider();
    const questions = await llmProvider.generateQuestions(theme, numQuestions);
    
    return questions;
  }
}