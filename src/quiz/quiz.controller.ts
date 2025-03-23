import { Controller, Get } from '@nestjs/common';
import { QuizService } from './quiz.service';


@Controller('quiz')
export class QuizController {
    constructor(private readonly quizService: QuizService) {}

    @Get()
    getQuiz() {
        return this.quizService.generateQuiz("História do Brasil", 2);
    }
}
