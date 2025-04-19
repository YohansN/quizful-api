import { Body, Controller, HttpException, HttpStatus, Post } from '@nestjs/common';
import { AuthPayloadDto } from './dto/auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {

    constructor(private readonly authService: AuthService) {}

    @Post('login')
    login(@Body() authPayload: AuthPayloadDto) {
        const userToken = this.authService.validateUser(authPayload);
        if (!userToken) throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
        return userToken;
    }
}
