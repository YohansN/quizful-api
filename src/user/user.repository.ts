import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // ajuste o caminho

@Injectable()
export class UserRepository{
    constructor(private readonly PrismaService: PrismaService) {}
    
    async createUser(id: string, username: string, email: string, password: string, passwordSalt: string) {
        const user = await this.PrismaService.user.create({
        data: {
            id,
            username,
            email,
            password,
            passwordSalt,
        },
        });
        return;
    }

    async findAllUsers() {
        return await this.PrismaService.user.findMany();
    }
    
    async findUserById(id: string) {
        const user = await this.PrismaService.user.findUnique({
        where: { id },
        });
        return user;
    }

    async findUserByEmail(email: string) {
        const user = await this.PrismaService.user.findFirst({
        where: { email },
        });
        return user;
    }

    async findUserByUsername(username: string) {
        const user = await this.PrismaService.user.findFirst({
        where: { username },
        });
        return user;
    }

    async deleteUser(id: string) {
        await this.PrismaService.user.delete({
        where: { id },
        });
    }
    
}