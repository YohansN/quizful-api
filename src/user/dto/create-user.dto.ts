import { IsEmail, IsNotEmpty, Min } from "class-validator";

export class CreateUserDto {
    @IsNotEmpty({ message: 'O nome não pode estar vazio' }) name: string;
    @IsEmail({}, { message: 'O e-mail informado é inválido' }) email: string;
    @IsNotEmpty({ message: 'A senha não pode estar vazia' }) 
    password: string;
  
    constructor(name: string, email: string, password: string) {
      this.name = name;
      this.email = email;
      this.password = password;
    }
  }  