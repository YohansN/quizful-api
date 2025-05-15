import { Question } from 'src/quiz/entities/quiz.entity';
import { LLMProvider } from '../llm.interface';
const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");

export class GeminiLLM implements LLMProvider {
  private readonly genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  private readonly schema = {
    description: "Lista de perguntas de múltipla escolha",
    type: SchemaType.OBJECT,
    properties: {
      questions: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            statement: { 
              type: SchemaType.STRING, 
              description: "Texto da pergunta" 
            },
            options: {
              type: SchemaType.ARRAY,
              description: "Array com 4 alternativas",
              items: { type: SchemaType.STRING }
            },
            correctIndex: {
              type: SchemaType.INTEGER,
              description: "Índice que indica a alternativa correta (0 = primeira resposta, 1 = segunda resposta, ...)",
            },
            justification: { 
              type: SchemaType.STRING, 
              description: "Explicação da resposta correta" 
            },
          },
          required: ["statement", "options", "correctIndex", "justification"]
        }
      }
    },
    required: ["questions"]
  };
  

  private readonly model = this.genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: this.schema,
      },
  });

  async generateQuestions(theme: string, numQuestions: number): Promise<Question[]> {
    const prompt = `Gere um conjunto de ${numQuestions} perguntas de múltipla escolha sobre o seguinte tema: "${theme}". Cada pergunta deve ter 4 opções de resposta, sendo apenas uma delas a correta. Inclua uma justificativa explicando a resposta correta. Formate a saída no seguinte JSON estruturado.`;
    const result = await this.model.generateContent(prompt);
    const parsedResponse = JSON.parse(result.response.text());

    const questions: Question[] = parsedResponse.questions.map((q: any, index: number) => ({
      displayId: `q${index + 1}`,
      statement: q.statement,
      options: q.options,
      correctOption: q.correctIndex,
      justification: q.justification,
    }));

    return questions;
  }
}
