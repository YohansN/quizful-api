import { Injectable } from '@nestjs/common';
import { LlmService } from 'src/llm/llm.service';
import { Quiz } from './entities/quiz.entity';
import { QuizRepository } from './quiz.repository';

@Injectable()
export class QuizService {
  constructor(private readonly LlmService: LlmService, private readonly QuizRepository: QuizRepository) {}

  async generateQuiz(theme: string, numQuestions: number, userId: string) {
    const questions = await this.LlmService.generateQuizQuestions(theme, numQuestions);
    console.log(questions)

    // Criar objeto Quiz com as perguntas geradas
    const quiz = new Quiz(theme, questions);
    console.log(quiz); 
    return quiz;
  }
}
