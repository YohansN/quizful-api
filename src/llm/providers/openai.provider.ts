import OpenAI from 'openai';
import { LLMProvider } from '../llm.interface';

export class OpenAILLM implements LLMProvider {
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  async generateQuestions(theme: string, numQuestions: number) {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'Você é um gerador de perguntas de múltipla escolha.' },
        { role: 'user', content: `Retorne uma lista de ${numQuestions} questões sobre "${theme}". Cada questão dessa lista deve conter 4 alternativas de resposta, com apenas uma correta. Além disso deve haver uma justificativa para a resposta certa. Use o formato JSON seguinte: {"questions":[{"id":"q1","question":"Pergunta aqui?","options":[{"letter":"A","text":"Opção 1","correctAnswer":true},{"letter":"B","text":"Opção 2","correctAnswer":false},{"letter":"C","text":"Opção 3","correctAnswer":false},{"letter":"D","text":"Opção 4","correctAnswer":false}],"justification":"Explicação sobre a resposta correta."}]}"` },
      ],
      temperature: 0.7,
    });

    return this.parseResponse(response);
  }

  private parseResponse(response: any): any[] { //trocar por Questions
    // Transformar a resposta do OpenAI em um array estruturado de perguntas
    return []; //TODO
  }
}
