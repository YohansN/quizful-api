import { Body, Controller, Post, Get, Param } from '@nestjs/common';
import { QuizService } from './quiz.service';

@Controller('quiz')
export class QuizController {
    constructor(private readonly quizService: QuizService) {}

    @Post()
    getQuiz(@Body('theme') theme: string, @Body('questionNumber') questionNumber: number, @Body('userId') userId: string) {
        return this.quizService.generateQuiz(theme, questionNumber, userId);
    }

    @Get('user/:userId')
    getQuizzesByUserId(@Param('userId') userId: string) {
        return this.quizService.getQuizzesByUserId(userId);
    }

    @Get('room/:roomId')
    getQuizWithCreator(@Param('roomId') roomId: string) {
        return this.quizService.getQuizWithCreator(roomId);
    }
}
