import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QuizModule } from './quiz/quiz.module';
import { LlmModule } from './llm/llm.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [QuizModule, LlmModule, UserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
