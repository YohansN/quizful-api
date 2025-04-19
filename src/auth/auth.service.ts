import { Injectable } from '@nestjs/common';
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
            return null;
        }

        const hashedPassword = createHash("sha256")
            .update(password + userFound.passwordSalt)
            .digest("hex")
        
        if (hashedPassword === userFound.password) {
            //console.log(userFound);
            const { password: _, passwordSalt, ...safeUser } = userFound;
            return this.jwtService.sign(safeUser);
        }
            
        
    }
}
