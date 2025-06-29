import { Injectable } from '@nestjs/common';
import { QuizParticipationRepository, PlayerAnswer } from './quiz-participation.repository';
import { QuizRepository } from './quiz.repository';

@Injectable()
export class QuizParticipationService {
    constructor(
        private readonly participationRepository: QuizParticipationRepository,
        private readonly quizRepository: QuizRepository
    ) {}

    async joinQuiz(userId: string, quizId: string) {
        // Verificar se já participou deste quiz
        const existingParticipation = await this.participationRepository.findParticipation(userId, quizId);
        
        if (existingParticipation) {
            return existingParticipation; // Retorna participação existente
        }

        // Criar nova participação
        return await this.participationRepository.createParticipation(userId, quizId);
    }

    async finishQuiz(userId: string, quizId: string, score: number, answers: PlayerAnswer[]) {
        return await this.participationRepository.updateParticipationScore(userId, quizId, score, answers);
    }

    async getUserParticipations(userId: string) {
        // return await this.participationRepository.getUserParticipationsWithCreator(userId);

        const participations = await this.participationRepository.getUserParticipationsWithCreator(userId);
        const quizzes = participations.map(p => ({
            theme: p.quiz.theme,
            numberOfQuestions: p.quiz.numberOfQuestions,
            createdAt: p.quiz.createdAt,
            createdByUser: p.quiz.User.username,
        }));
        return quizzes;

    }

    async getUserStats(username: string) {
        return await this.participationRepository.getUserParticipationStats(username);
    }

    async getUserAccuracyRate(userId: string) {
        return await this.participationRepository.getUserAccuracyRate(userId);
    }

    async getParticipation(userId: string, quizId: string) {
        return await this.participationRepository.findParticipation(userId, quizId);
    }

    async getUserQuizzes(userId: string) {
        return await this.quizRepository.findQuizzesByUserId(userId);
    }
} 