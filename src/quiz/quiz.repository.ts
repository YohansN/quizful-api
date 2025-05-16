import { PrismaService } from "src/prisma/prisma.service";
import { Injectable } from "@nestjs/common";

@Injectable()
export class QuizRepository {
    constructor(private readonly PrismaService: PrismaService) {}
}