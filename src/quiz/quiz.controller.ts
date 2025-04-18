import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { QuizService } from './quiz.service';


@Controller('quiz')
export class QuizController {
    constructor(private readonly quizService: QuizService) {}

    @Post()
    getQuiz(@Body('theme') theme: string, @Body('questionNumber') questionNumber: number, @Body('userId') userId: string) {
        return this.quizService.generateQuiz(theme, questionNumber, userId);
    }

    @Get()
    getAllQuizzes() {
        return this.quizService.findAll();
    }

    @Get(':id')
    getQuizById(@Param('id') id: string) {
        return this.quizService.findOneById(id);
    }

}
