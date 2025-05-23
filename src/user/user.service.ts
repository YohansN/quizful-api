import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  constructor(private readonly userRepository : UserRepository) {}

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

  // update(id: number, updateUserDto: UpdateUserDto) {
  //   return `This action updates a #${id} user`;
  // }

  remove(id: string) {
    this.userRepository.deleteUser(id);
  }
}
