import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const newUser = await this.userService.create(createUserDto);
    return {
      message: "Usuário criado com sucesso!",
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
      },
    };
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get('email')
  findOneByEmailQuery(@Query('email') email: string) {
    return this.userService.findOneByEmail(email);
  }

  @Get('email/:email')
  findOneByEmailParam(@Param('email') email: string) {
    return this.userService.findOneByEmail(email);
  }

  @Get(':username')
  findOneByUsername(@Param('username') username: string) {
    return this.userService.findOneByUsername(username);
  }
  
  @Get('id/:id')
  findOneById(@Param('id') id: string) {
    return this.userService.findOneById(id);
  }

  @Get(':username/stats')
  async getUserStats(@Param('username') username: string) {
    const stats = await this.userService.getUserStats(username);
    return {
      user: username,
      stats,
    };
  }

  @Get(':id/participations') //Quizzes que o usuário participou
  async getUserParticipations(@Param('id') id: string) {
    const participations = await this.userService.getUserParticipations(id);
    return {
      userId: id,
      participations,
    };
  }

  @Get(':id/accuracy')
  async getUserAccuracyRate(@Param('id') id: string) {
    const accuracy = await this.userService.getUserAccuracyRate(id);
    return {
      userId: id,
      accuracy,
    };
  }

  @Get(':id/quizzes') // Quizzes criados pelo usuário
  async getUserQuizzes(@Param('id') id: string) {
    const quizzes = await this.userService.getUserQuizzes(id);
    return {
      userId: id,
      quizzes,
    };
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
  //   return this.userService.update(+id, updateUserDto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
  const responde = this.userService.remove(id);
  return {
    message: "Usuário deletado com sucesso!",
    id: id,
    }
  }

}
