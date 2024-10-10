import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import * as argon from 'argon2';
import { CreateAuthDto } from './dto/create-auth.dto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: loginDto.email,
      },
    });
    if (!user) {
      throw new ForbiddenException('Incorrect credentials');
    }

    const isPassword = await argon.verify(user.passwordHash, loginDto.password);
    if (!isPassword) {
      throw new ForbiddenException('Incorrect credentials');
    }
    const tokens = await this.getTokens(user);
    return { ...tokens };
  }

  async register(createAuthDto: CreateAuthDto) {
    const passwordHash = await argon.hash(createAuthDto.password);
    try {
      const user = await this.prisma.user.create({
        data: {
          firstName: createAuthDto.firstName,
          lastName: createAuthDto.lastName,
          email: createAuthDto.email,
          passwordHash,
        },
      });
      const tokens = await this.getTokens(user);
      return { ...tokens };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new BadRequestException('Email is already taken');
      }
      throw error;
    }
  }

  async getTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: '30m',
        algorithm: 'HS256',
      }),
      this.jwt.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
        algorithm: 'HS256',
      }),
    ]);

    return { access_token: accessToken, refresh_token: refreshToken };
  }
}
