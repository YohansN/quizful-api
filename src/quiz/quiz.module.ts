import { Module } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizGateway } from './quiz.gateway';
import { LlmService } from 'src/llm/llm.service';
import { QuizController } from './quiz.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { QuizRepository } from './quiz.repository';
import { UserModule } from 'src/user/user.module';

@Module({
  providers: [QuizGateway, QuizService, LlmService, QuizRepository],
  controllers: [QuizController],
  imports: [PrismaModule, UserModule],
})
export class QuizModule {}
