import axios from 'axios';
import { LLMProvider } from '../llm.interface';

export class OllamaLLM implements LLMProvider {
  private readonly baseUrl = process.env.OLLAMA_API_URL;

  async generateQuestions(theme: string, numQuestions: number) {
    const response = await axios.post(`${this.baseUrl}/api/generate`, {
      model: "llama3.1",
      prompt: `Retorne uma lista de ${numQuestions} questões sobre "${theme}". Cada questão dessa lista deve conter 4 alternativas de resposta, com apenas uma correta. Além disso deve haver uma justificativa para a resposta certa. Use o formato JSON seguinte: {"questions":[{"id":"q1","question":"Pergunta aqui?","options":[{"letter":"A","text":"Opção 1","correctAnswer":true},{"letter":"B","text":"Opção 2","correctAnswer":false},{"letter":"C","text":"Opção 3","correctAnswer":false},{"letter":"D","text":"Opção 4","correctAnswer":false}],"justification":"Explicação sobre a resposta correta."}]}"`,
      stream: false
    });
    return response.data.questions;
  }
}
