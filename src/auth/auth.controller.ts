import { Body, Controller, HttpException, HttpStatus, Post, Request, UseGuards } from '@nestjs/common';
import { AuthPayloadDto } from './dto/auth.dto';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { LocalGuard } from './guards/local.guard';

@Controller('auth')
export class AuthController {

    constructor(private readonly authService: AuthService) {}

    @Post('login')
    @UseGuards(LocalGuard)
    login(@Request() req) {
        return this.authService.login(req.user);
    }
}
