import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginDto } from './dto/login-auth.dto';

@Controller('auth')
export class AuthController {
  private baseUrl: string;
  private port: string;

  constructor(
    private readonly authService: AuthService,
    private configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get('APP_URL');
    this.port = this.configService.get('APP_PORT');
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  register(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.register(createAuthDto);
  }

  // @Post('register')
  // @Redirect('http://localhost:3000')
  // register(@Body() createAuthDto: CreateAuthDto) {
  //   const x = Math.floor(Math.random() * 10) + 1;
  //   const response = this.authService.register(createAuthDto);
  //   if (x % 2 === 0) {
  //     return response;
  //   } else {
  //     return { url: `${this.baseUrl}:${this.port}/error` };
  //   }
  // }
}
