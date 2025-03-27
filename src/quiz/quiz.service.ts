import { Injectable } from '@nestjs/common';
import { LlmService } from 'src/llm/llm.service';
import { Question, Quiz } from './entities/quiz.entity';

@Injectable()
export class QuizService {
  constructor(private readonly LlmService: LlmService) {}

  async generateQuiz(theme: string, numQuestions: number, userId: string) {
      const questionsData = await this.LlmService.generateQuizQuestions(theme, numQuestions);
      
      const questions = questionsData.map((q: any) => new Question(q));
      
      // Criar objeto Quiz com as perguntas geradas
      const quiz = new Quiz(theme, numQuestions, questions, userId);
      // TODO
      // Salvar no banco de dados
      //Retorna o objeto Quiz para o user 
      return quiz;
  }
}
