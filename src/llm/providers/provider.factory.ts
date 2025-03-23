import { LLMProvider } from '../llm.interface';
import { GeminiLLM } from './gemini.provider';
import { OllamaLLM } from './ollama.provider';
import { OpenAILLM } from './openai.provider';

export function createLLMProvider(): LLMProvider {
  console.log(`LLM_PROVIDER: ${process.env.LLM_PROVIDER}`);
  switch (process.env.LLM_PROVIDER) {
    case "openai":
      return new OpenAILLM();
    case "gemini":
      return new GeminiLLM();
    default:
      return new OllamaLLM();
  }
}