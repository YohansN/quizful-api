import { PrismaService } from "src/prisma/prisma.service";
import { Injectable } from "@nestjs/common";
import { Quiz } from "./entities/quiz.entity";

@Injectable()
export class QuizRepository {
    constructor(private readonly PrismaService: PrismaService) {}

    async saveQuiz(roomId: string, quiz: Quiz, createdById: string) {
        // Converter o quiz completo para um formato JSON válido
        const quizData = {
            theme: quiz.theme,
            numQuestions: quiz.numQuestions,
            questions: quiz.questions.map(q => ({
                displayId: q.displayId,
                statement: q.statement,
                options: q.options,
                correctOption: q.correctOption,
                justification: q.justification
            }))
        };

        const quizRecord = await this.PrismaService.quiz.create({
            data: {
                roomId,
                theme: quiz.theme,
                numberOfQuestions: quiz.numQuestions,
                quizData, // Quiz completo como JSON
                createdById,
            },
        });
        return quizRecord;
    }

    async findQuizByRoomId(roomId: string) {
        return await this.PrismaService.quiz.findUnique({
            where: { roomId },
        });
    }

    async findQuizzesByUserId(userId: string) {
        return await this.PrismaService.quiz.findMany({
            where: { createdById: userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findQuizWithCreator(roomId: string) {
        return await this.PrismaService.quiz.findUnique({
            where: { roomId },
            include: {
                User: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                    }
                }
            }
        });
    }
}