import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategy';

@Module({
  imports: [JwtModule.register({})], // signs/decodes the jwt
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
