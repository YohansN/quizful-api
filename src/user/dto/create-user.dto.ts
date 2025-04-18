import { IsEmail, IsNotEmpty, Min } from "class-validator";

export class CreateUserDto {
    @IsNotEmpty({ message: 'O nome não pode estar vazio' }) username: string;
    @IsEmail({}, { message: 'O e-mail informado é inválido' }) email: string;
    @IsNotEmpty({ message: 'A senha não pode estar vazia' }) password: string;
  
    constructor(username: string, email: string, password: string) {
      this.username = username;
      this.email = email;
      this.password = password;
    }
  }  