import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserRepository } from './user.repository';
import { QuizParticipationService } from '../quiz/quiz-participation.service';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository : UserRepository,
    private readonly participationService: QuizParticipationService
  ) {}

  async create(createUserDto: CreateUserDto) {
    await this.userRepository.findUserByEmail(createUserDto.email).then((user) => {
      if (user) {
        throw new BadRequestException('Este email já está em uso');
      }
    });
    const newUser = new User(createUserDto.username, createUserDto.email, createUserDto.password);
    await this.userRepository.createUser(newUser.id, newUser.username, newUser.email, newUser.passwordHash, newUser.passwordSalt);
    return newUser;
  }

  findAll() {
    return this.userRepository.findAllUsers();
  }

  findOneById(id: string) {
    return this.userRepository.findUserById(id);
  }

  findOneByEmail(email: string) {
    return this.userRepository.findUserByEmail(email);
  }

  findOneByUsername(username: string) {
    return this.userRepository.findUserByUsername(username);
  }

  async getUserStats(userId: string) {
    return await this.participationService.getUserStats(userId);
  }

  async getUserParticipations(userId: string) {
    return await this.participationService.getUserParticipations(userId);
  }

  async getUserAccuracyRate(userId: string) {
    return await this.participationService.getUserAccuracyRate(userId);
  }

  async getUserQuizzes(userId: string) {
    return await this.participationService.getUserQuizzes(userId);
  }

  // update(id: number, updateUserDto: UpdateUserDto) {
  //   return `This action updates a #${id} user`;
  // }

  remove(id: string) {
    this.userRepository.deleteUser(id);
  }
}
