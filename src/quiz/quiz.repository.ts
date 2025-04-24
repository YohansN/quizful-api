import { PrismaService } from "src/prisma/prisma.service";
import { Quiz } from "./entities/quiz.entity";
import { Injectable } from "@nestjs/common";

@Injectable()
export class QuizRepository {
    constructor(private readonly PrismaService: PrismaService) {}
    
    async create(quiz: Quiz) {
        //console.log(quiz);  //Debugando (objeto que chegou para ser salvo)
        // quiz.questions.forEach((q, idx) => {
        //     console.log(`Questão ${idx + 1}:`);
        //     q.options.forEach((opt) => {
        //       console.log(`  Letra: ${opt.letter}, Texto: ${opt.text}, ID: ${opt.id}`);
        //     });
        //   });
        await this.PrismaService.quiz.create({
            data: {
                id: quiz.id,
                theme: quiz.theme,
                numberOfQuestions: quiz.numQuestions,
                createdById: "6646838f-6bdb-54f3-9415-1f1068c0f4c5", //Usando enquanto não tem autenticação para passar o ID do usuário, modificar para quiz.creator_ID
                questions: {
                    create: quiz.questions.map((question) => ({
                        id: question.id,
                        displayId: question.displayId,
                        question: question.question,
                        justification: question.justification,
                        options: {
                            create: question.options.map((option) => ({
                                id: option.id,
                                optionLetter: option.letter,
                                text: option.text,
                                isCorrect: option.correctAnswer,
                            })),
                        },
                    })),
                },
            },
        });
        return quiz;
    }

    async findOneById(id: string) {
        const quiz = await this.PrismaService.quiz.findUnique({
            where: { id },
            include: {
                questions: {
                    include: {
                        options: true,
                    },
                },
            },
        });
        return quiz;
    }

    async findAll() {
        const quizzes = await this.PrismaService.quiz.findMany({
            include: {
                questions: {
                    include: {
                        options: true,
                    },
                },
            },
        });
        return quizzes;
    }
}