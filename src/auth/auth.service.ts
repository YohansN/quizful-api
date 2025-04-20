import { HttpException, Injectable } from '@nestjs/common';
import { AuthPayloadDto } from './dto/auth.dto';
import { UserService } from 'src/user/user.service';
import { createHash } from 'crypto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(private readonly userService: UserService, private readonly jwtService: JwtService) {}

    async validateUser({email, password}: AuthPayloadDto) {
        const userFound = await this.userService.findOneByEmail(email);
         if (!userFound) {
            throw new HttpException('User not found', 404);
        }

        const hashedPassword = createHash("sha256")
            .update(password + userFound.passwordSalt)
            .digest("hex")
        
        if (hashedPassword === userFound.password) {
            //console.log(userFound);
            const { password: _, passwordSalt, ...safeUser } = userFound;
            return safeUser;
        }
        throw new HttpException('Invalid credentials', 401);
    }

    async login(user: any) { //Gera o token com o usuário já validado
        return {
            access_token: this.jwtService.sign(user),
        };
    }
}
