import { BadRequestException, Injectable } from '@nestjs/common';
import { LlmService } from 'src/llm/llm.service';
import { Question, Quiz } from './entities/quiz.entity';
// import { PrismaService } from 'src/prisma/prisma.service';
import { QuizRepository } from './quiz.repository';
import { validate as isUuid } from 'uuid';
import { v5 as uuidv5 } from 'uuid';


@Injectable()
export class QuizService {
  constructor(private readonly LlmService: LlmService, private readonly QuizRepository: QuizRepository) {}

  async generateQuiz(theme: string, numQuestions: number, userId: string) {
    const questionsData = await this.LlmService.generateQuizQuestions(theme, numQuestions);
    
    const questions = questionsData.map((q: any) => {
      //console.log(q);
      return new Question(q);
    });
    
    // Criar objeto Quiz com as perguntas geradas
    //console.log(questions);
    const quiz = new Quiz(theme, numQuestions, questions, userId);
    //console.log(quiz); 

    // Salvar no banco de dados
    const savedQuiz = await this.QuizRepository.create(quiz);

    //Retorna o objeto Quiz para o user 
    return savedQuiz;
  }

  async findOneById(id: string) {
    if (!isUuid(id)) {
      throw new BadRequestException('ID inválido');
    }

    return await this.QuizRepository.findOneById(id).then((quiz) => {
      if (!quiz) {
        throw new BadRequestException('Quiz não foi encontrado');
      }
      return quiz;
    });
  }


  async findAll() {
    return await this.QuizRepository.findAll();
  } 
}
