import { Injectable } from '@nestjs/common';
import { CreateQuizDto } from './dto/create-quiz.dto';
import * as crypto from 'crypto';

@Injectable()
export class QuizService {

  create(createQuizDto: CreateQuizDto) { 
    return { id: 12}
  }

  generateRequestHash(theme: string, numQuestions: number) {
    // Cria um hash de acordo com o tema e numero de questões que será armazenado no banco para evitar uso da llm em todas as requisições.
    return crypto.createHash('sha256').update(`${theme}-${numQuestions}`).digest('hex');
  }
}
