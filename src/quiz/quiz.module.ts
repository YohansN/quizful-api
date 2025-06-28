import { Module, forwardRef } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizGateway } from './quiz.gateway';
import { LlmService } from 'src/llm/llm.service';
import { QuizController } from './quiz.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { QuizRepository } from './quiz.repository';
import { UserModule } from 'src/user/user.module';
import { QuizParticipationRepository } from './quiz-participation.repository';
import { QuizParticipationService } from './quiz-participation.service';

@Module({
  providers: [QuizGateway, QuizService, LlmService, QuizRepository, QuizParticipationRepository, QuizParticipationService],
  controllers: [QuizController],
  imports: [PrismaModule, forwardRef(() => UserModule)],
  exports: [QuizRepository, QuizParticipationService],
})
export class QuizModule {}
