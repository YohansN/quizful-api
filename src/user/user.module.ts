import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UserRepository } from './user.repository';
import { QuizParticipationRepository } from '../quiz/quiz-participation.repository';
import { QuizModule } from '../quiz/quiz.module';

@Module({
  controllers: [UserController],
  providers: [UserService, UserRepository, QuizParticipationRepository],
  imports: [PrismaModule, forwardRef(() => QuizModule)],
  exports: [UserService],
})
export class UserModule {}
