import { Question } from 'src/quiz/entities/quiz.entity';
import { LLMProvider } from '../llm.interface';
import { v4 as uuidv4 } from 'uuid';
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
            displayId: { type: SchemaType.STRING, description: "ID único da pergunta (q1, q2, q3 ...)" },
            question: { type: SchemaType.STRING, description: "Texto da pergunta" },
            options: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  letter: { type: SchemaType.STRING, description: "Letra da opção (A, B, C, D)" },
                  text: { type: SchemaType.STRING, description: "Texto da opção" },
                  correctAnswer: { type: SchemaType.BOOLEAN, description: "Indica se a opção está correta" },
                },
                required: ["letter", "text", "correctAnswer"],
              },
            },
            justification: { type: SchemaType.STRING, description: "Explicação da resposta correta" },
          },
          required: ["displayId", "question", "options", "justification"],
        },
      },
    },
    required: ["questions"],
};

private readonly model = this.genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: this.schema,
    },
});

  async generateQuestions(theme: string, numQuestions: number): Promise<Question[]> {
    const prompt = `Gere um conjunto de ${numQuestions} perguntas de múltipla escolha sobre o seguinte tema: "${theme}". Cada pergunta deve ter 4 opções de resposta (A, B, C, D), sendo apenas uma correta. Inclua uma justificativa explicando a resposta correta. Formate a saída no seguinte JSON estruturado.`;
    const result = await this.model.generateContent(prompt);
    const parsedResponse = JSON.parse(result.response.text());

    return parsedResponse.questions.map((q: any, index: number) => ({
      id: uuidv4(),
      displayId: `q${index + 1}`, // q1, q2, q3...
      question: q.question,
      options: q.options.map((opt: any) => ({
        id: uuidv4(),
        letter: opt.letter,
        text: opt.text,
        correctAnswer: opt.correctAnswer,
      })),
      justification: q.justification,
  }));
  }
}
