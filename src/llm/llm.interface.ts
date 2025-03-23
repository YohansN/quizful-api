import { Question } from "src/quiz/entities/quiz.entity";


export interface LLMProvider {
    generateQuestions(theme: string, numQuestions: number): Promise<Question[]>;
}
