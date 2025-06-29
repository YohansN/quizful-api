import { PrismaService } from "src/prisma/prisma.service";
import { Injectable } from "@nestjs/common";

export interface PlayerAnswer {
    questionIndex: number;
    selectedOption: number;
    isCorrect: boolean;
}

@Injectable()
export class QuizParticipationRepository {
    constructor(private readonly PrismaService: PrismaService) {}

    async createParticipation(userId: string, quizId: string) {
        return await this.PrismaService.quizParticipation.create({
            data: {
                userId,
                quizId,
                answers: [],
                score: 0,
            },
        });
    }

    async updateParticipationScore(userId: string, quizId: string, score: number, answers: PlayerAnswer[]) {
        // Converter as respostas para um formato JSON válido
        const answersData = {
            answers: answers.map(answer => ({
                questionIndex: answer.questionIndex,
                selectedOption: answer.selectedOption,
                isCorrect: answer.isCorrect,
            }))
        };

        return await this.PrismaService.quizParticipation.update({
            where: {
                userId_quizId: {
                    userId,
                    quizId,
                },
            },
            data: {
                score,
                answers: answersData,
                finishedAt: new Date(),
            },
        });
    }

    async findParticipation(userId: string, quizId: string) {
        return await this.PrismaService.quizParticipation.findUnique({
            where: {
                userId_quizId: {
                    userId,
                    quizId,
                },
            },
        });
    }

    async getUserParticipationsWithCreator(userId: string) { //Retorna uma lista de todos os quizzes que o usuario participou.
        return await this.PrismaService.quizParticipation.findMany({
            where: { userId },
            include: {
                quiz: {
                    select: {
                        theme: true,
                        numberOfQuestions: true,
                        createdAt: true,
                        User: { // Criador do quiz
                            select: {
                                username: true,
                            }
                        }
                    }
                },
            },
            orderBy: { joinedAt: 'desc' },
        });
    }

    async getUserParticipationStats(username: string) {
        const participations = await this.PrismaService.quizParticipation.findMany({
            where: { user: { username } },
            select: {
                score: true,
                finishedAt: true,
                answers: true,
            },
        });

        const totalParticipations = participations.length;
        const totalScore = participations.reduce((sum, p) => sum + p.score, 0);
        const averageScore = totalParticipations > 0 ? totalScore / totalParticipations : 0;
        const completedQuizzes = participations.filter(p => p.finishedAt !== null).length;

        // Calcular taxa de acertos
        let totalQuestions = 0;
        let totalCorrectAnswers = 0;

        participations.forEach(participation => {
            if (participation.finishedAt && participation.answers) {
                const answersData = participation.answers as any;
                if (answersData.answers && Array.isArray(answersData.answers)) {
                    totalQuestions += answersData.answers.length;
                    totalCorrectAnswers += answersData.answers.filter((answer: any) => answer.isCorrect).length;
                }
            }
        });

        const accuracyRate = totalQuestions > 0 ? (totalCorrectAnswers / totalQuestions) * 100 : 0;

        return {
            totalParticipations,
            totalScore,
            averageScore: Math.round(averageScore * 100) / 100,
            completedQuizzes,
            quizzesInProgress: totalParticipations - completedQuizzes,
            totalQuestions,
            totalCorrectAnswers,
            accuracyRate: Math.round(accuracyRate * 100) / 100,
        };
    }

    async getUserAccuracyRate(userId: string) {
        const participations = await this.PrismaService.quizParticipation.findMany({
            where: { userId },
            select: {
                answers: true,
                finishedAt: true,
            },
        });

        let totalQuestions = 0;
        let totalCorrectAnswers = 0;

        participations.forEach(participation => {
            if (participation.finishedAt && participation.answers) {
                const answersData = participation.answers as any;
                if (answersData.answers && Array.isArray(answersData.answers)) {
                    totalQuestions += answersData.answers.length;
                    totalCorrectAnswers += answersData.answers.filter((answer: any) => answer.isCorrect).length;
                }
            }
        });

        const accuracyRate = totalQuestions > 0 ? (totalCorrectAnswers / totalQuestions) * 100 : 0;

        return {
            totalQuestions,
            totalCorrectAnswers,
            accuracyRate: Math.round(accuracyRate * 100) / 100, // Arredonda para 2 casas decimais
        };
    }
} 