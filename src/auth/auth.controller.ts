import { Body, Controller, Get, HttpException, HttpStatus, Post, Req, Request, UseGuards } from '@nestjs/common';
import { AuthPayloadDto } from './dto/auth.dto';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { LocalGuard } from './guards/local.guard';
import { JwtAuthGuard } from './guards/jwt.guard';

@Controller('auth')
export class AuthController {

    constructor(private readonly authService: AuthService) {}

    @Post('login')
    @UseGuards(LocalGuard)
    login(@Request() req) {
        return this.authService.login(req.user);
    }

    @Get('status')
    @UseGuards(JwtAuthGuard) //Usado pra validar o token gerado no login
    status(@Request() req) {
        console.log(req.user);
    }
}
