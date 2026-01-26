import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User as PrismaUser } from '@prisma/client';
import { AuthResponse, AuthTokens, User } from '@wigtn/shared';

import { PrismaService } from '../../database/prisma.service';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

// In-memory store for password reset codes (replace with Redis in production)
const resetCodes = new Map<string, { code: string; expiresAt: Date }>();

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, password, name } = registerDto;

    // Check if user exists
    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        provider: 'local',
      },
    });

    // Generate tokens and return response
    return this.generateAuthResponse(user);
  }

  async validateUser(email: string, password: string): Promise<PrismaUser | null> {
    const user = await this.userService.findByEmail(email);
    if (!user || !user.passwordHash) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async login(user: PrismaUser): Promise<AuthResponse> {
    return this.generateAuthResponse(user);
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    // Find refresh token in database
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Delete old refresh token
    await this.prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    // Generate new tokens
    return this.generateTokens(storedToken.user);
  }

  async logout(userId: string, refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        token: refreshToken,
      },
    });

    return { success: true, data: { message: 'Logged out successfully' } };
  }

  async getCurrentUser(userId: string): Promise<{ success: true; data: User }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      data: this.toUserResponse(user),
    };
  }

  async forgotPassword(email: string) {
    const user = await this.userService.findByEmail(email);

    // Always return success to prevent email enumeration
    if (!user) {
      return { success: true, data: { message: 'If the email exists, a reset code has been sent' } };
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store code (use Redis in production)
    resetCodes.set(email, { code, expiresAt });

    // TODO: Send email with code
    console.log(`[DEV] Password reset code for ${email}: ${code}`);

    return { success: true, data: { message: 'If the email exists, a reset code has been sent' } };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const stored = resetCodes.get(dto.email);

    if (!stored || stored.code !== dto.code) {
      throw new BadRequestException('Invalid reset code');
    }

    if (stored.expiresAt < new Date()) {
      resetCodes.delete(dto.email);
      throw new BadRequestException('Reset code expired');
    }

    // Find user and update password
    const user = await this.userService.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Clear the code
    resetCodes.delete(dto.email);

    return { success: true, data: { message: 'Password reset successfully' } };
  }

  async socialLogin(provider: 'apple' | 'google', idToken: string): Promise<AuthResponse> {
    // TODO: Verify idToken with provider
    const payload = this.decodeSocialToken(idToken);

    let user = await this.prisma.user.findFirst({
      where: {
        provider,
        providerId: payload.sub,
      },
    });

    if (!user) {
      // Create new user
      user = await this.prisma.user.create({
        data: {
          email: payload.email,
          name: payload.name,
          provider,
          providerId: payload.sub,
        },
      });
    }

    return this.generateAuthResponse(user);
  }

  private async generateAuthResponse(user: PrismaUser): Promise<AuthResponse> {
    const tokens = await this.generateTokens(user);

    return {
      user: this.toUserResponse(user),
      tokens,
    };
  }

  private async generateTokens(user: PrismaUser): Promise<AuthTokens> {
    const payload = { sub: user.id, email: user.email };

    // Access token (15 minutes)
    const accessToken = this.jwtService.sign(payload);

    // Refresh token (7 days)
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
    });

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  private toUserResponse(user: PrismaUser): User {
    return {
      id: user.id,
      email: user.email,
      name: user.name || '',
      provider: user.provider as 'local' | 'apple' | 'google',
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  private decodeSocialToken(idToken: string) {
    // TODO: Implement actual token verification
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Invalid token format');
    }
    return JSON.parse(Buffer.from(parts[1], 'base64').toString());
  }
}
