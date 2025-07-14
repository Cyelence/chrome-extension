import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import { nanoid } from 'nanoid';
import { prisma } from '@/utils/database';
import { authLogger } from '@/utils/logger';
import { appConfig } from '@/config';
import { createError } from '@/utils/errors';
import {
  User,
  SessionData,
  AuthResult,
  LoginCredentials,
  RegisterCredentials,
  TokenPair,
  UserJwtPayload,
  SafeUser,
  DeviceInfo
} from '@/types';

/**
 * Authentication service class
 */
export class AuthService {
  /**
   * Hash password using Argon2
   */
  private async hashPassword(password: string): Promise<string> {
    try {
      return await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16, // 64 MB
        timeCost: 3,
        parallelism: 1
      });
    } catch (error) {
      authLogger.error('Password hashing failed', { error });
      throw createError.internal('Password hashing failed');
    }
  }

  /**
   * Verify password using Argon2
   */
  private async verifyPassword(hashedPassword: string, plainPassword: string): Promise<boolean> {
    try {
      return await argon2.verify(hashedPassword, plainPassword);
    } catch (error) {
      authLogger.error('Password verification failed', { error });
      return false;
    }
  }

  /**
   * Generate JWT token
   */
  private generateAccessToken(payload: UserJwtPayload): string {
    return jwt.sign(payload, appConfig.auth.jwtSecret, {
      expiresIn: appConfig.auth.jwtExpiresIn,
      issuer: 'digital-wardrobe-backend',
      subject: payload.userId
    });
  }

  /**
   * Generate refresh token
   */
  private generateRefreshToken(): string {
    return jwt.sign(
      { type: 'refresh', jti: nanoid() },
      appConfig.auth.jwtSecret,
      {
        expiresIn: appConfig.auth.jwtRefreshExpiresIn,
        issuer: 'digital-wardrobe-backend'
      }
    );
  }

  /**
   * Verify JWT token
   */
  private verifyToken(token: string): UserJwtPayload {
    try {
      const payload = jwt.verify(token, appConfig.auth.jwtSecret) as UserJwtPayload;
      return payload;
    } catch (error) {
      authLogger.warn('Token verification failed', { error });
      throw createError.auth('Invalid or expired token');
    }
  }

  /**
   * Create user session
   */
  private async createSession(
    userId: string,
    deviceInfo?: DeviceInfo,
    ipAddress?: string
  ): Promise<SessionData> {
    try {
      const sessionToken = nanoid(32);
      const refreshToken = this.generateRefreshToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      const session = await prisma.session.create({
        data: {
          userId,
          token: sessionToken,
          refreshToken,
          expiresAt,
          deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : null,
          ipAddress,
          userAgent: deviceInfo?.userAgent,
          isActive: true
        }
      });

      authLogger.info('Session created', { userId, sessionId: session.id });
      return session;
    } catch (error) {
      authLogger.error('Session creation failed', { userId, error });
      throw createError.internal('Session creation failed');
    }
  }

  /**
   * Convert user to safe user object
   */
  private toSafeUser(user: User): SafeUser {
    const {
      passwordHash,
      passwordResetToken,
      passwordResetExpires,
      emailVerificationToken,
      emailVerificationExpires,
      ...safeUser
    } = user;

    return safeUser;
  }

  /**
   * Validate password strength
   */
  private validatePasswordStrength(password: string): boolean {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  /**
   * Validate email format
   */
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Register new user
   */
  async register(credentials: RegisterCredentials): Promise<AuthResult> {
    try {
      const { email, password, username, firstName, lastName, acceptTerms } = credentials;

      // Validate required fields
      if (!email || !password || !acceptTerms) {
        throw createError.validation('Missing required fields');
      }

      // Validate email format
      if (!this.validateEmail(email)) {
        throw createError.validation('Invalid email format');
      }

      // Validate password strength
      if (!this.validatePasswordStrength(password)) {
        throw createError.validation(
          'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character'
        );
      }

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            ...(username ? [{ username }] : [])
          ]
        }
      });

      if (existingUser) {
        throw createError.validation('User already exists with this email or username');
      }

      // Hash password
      const passwordHash = await this.hashPassword(password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          username,
          firstName,
          lastName,
          passwordHash,
          displayName: firstName && lastName ? `${firstName} ${lastName}` : username || email.split('@')[0],
          isEmailVerified: false,
          emailVerificationToken: nanoid(),
          emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      });

      // Create session
      const session = await this.createSession(user.id);

      // Generate tokens
      const tokens = this.generateTokens(user, session.id);

      // Log successful registration
      authLogger.info('User registered successfully', { userId: user.id, email });

      return {
        user: this.toSafeUser(user),
        tokens,
        isNewUser: true
      };
    } catch (error) {
      authLogger.error('Registration failed', { email: credentials.email, error });
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(credentials: LoginCredentials, deviceInfo?: DeviceInfo, ipAddress?: string): Promise<AuthResult> {
    try {
      const { email, password, rememberMe } = credentials;

      // Validate required fields
      if (!email || !password) {
        throw createError.validation('Email and password are required');
      }

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user || !user.passwordHash) {
        throw createError.auth('Invalid credentials');
      }

      // Verify password
      const isValidPassword = await this.verifyPassword(user.passwordHash, password);
      if (!isValidPassword) {
        throw createError.auth('Invalid credentials');
      }

      // Check if user is active
      if (!user.isActive) {
        throw createError.auth('Account is deactivated');
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      // Create session
      const session = await this.createSession(user.id, deviceInfo, ipAddress);

      // Generate tokens
      const tokens = this.generateTokens(user, session.id);

      // Log successful login
      authLogger.info('User logged in successfully', { userId: user.id, email });

      return {
        user: this.toSafeUser(user),
        tokens
      };
    } catch (error) {
      authLogger.error('Login failed', { email: credentials.email, error });
      throw error;
    }
  }

  /**
   * Generate token pair
   */
  private generateTokens(user: User, sessionId: string): TokenPair {
    const payload: UserJwtPayload = {
      userId: user.id,
      email: user.email,
      ...(user.username && { username: user.username }),
      subscriptionTier: user.subscriptionTier,
      sessionId
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken();

    return {
      accessToken,
      refreshToken,
      expiresIn: 24 * 60 * 60 // 24 hours in seconds
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<TokenPair> {
    try {
      // Verify refresh token
      const payload = this.verifyToken(refreshToken);
      
      if (payload['type'] !== 'refresh') {
        throw createError.auth('Invalid refresh token');
      }

      // Find active session
      const session = await prisma.session.findFirst({
        where: {
          refreshToken,
          isActive: true,
          expiresAt: { gt: new Date() }
        },
        include: {
          user: true
        }
      });

      if (!session) {
        throw createError.auth('Invalid or expired refresh token');
      }

      // Generate new tokens
      const tokens = this.generateTokens(session.user, session.id);

      // Update session with new refresh token
      await prisma.session.update({
        where: { id: session.id },
        data: { refreshToken: tokens.refreshToken }
      });

      authLogger.info('Token refreshed successfully', { userId: session.userId });
      return tokens;
    } catch (error) {
      authLogger.error('Token refresh failed', { error });
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(sessionId: string): Promise<void> {
    try {
      await prisma.session.update({
        where: { id: sessionId },
        data: { isActive: false }
      });

      authLogger.info('User logged out successfully', { sessionId });
    } catch (error) {
      authLogger.error('Logout failed', { sessionId, error });
      throw error;
    }
  }

  /**
   * Logout from all devices
   */
  async logoutAll(userId: string): Promise<void> {
    try {
      await prisma.session.updateMany({
        where: { userId },
        data: { isActive: false }
      });

      authLogger.info('User logged out from all devices', { userId });
    } catch (error) {
      authLogger.error('Logout all failed', { userId, error });
      throw error;
    }
  }

  /**
   * Verify user token and get user data
   */
  async verifyUser(token: string): Promise<SafeUser> {
    try {
      const payload = this.verifyToken(token);
      
      // Find user and active session
      const user = await prisma.user.findUnique({
        where: { id: payload.userId }
      });

      if (!user || !user.isActive) {
        throw createError.auth('User not found or inactive');
      }

      // Verify session is active
      const session = await prisma.session.findFirst({
        where: {
          id: payload.sessionId,
          userId: user.id,
          isActive: true,
          expiresAt: { gt: new Date() }
        }
      });

      if (!session) {
        throw createError.auth('Session expired or invalid');
      }

      return this.toSafeUser(user);
    } catch (error) {
      authLogger.error('User verification failed', { error });
      throw error;
    }
  }

  /**
   * Change password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      // Find user
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user || !user.passwordHash) {
        throw createError.auth('User not found');
      }

      // Verify current password
      const isValidPassword = await this.verifyPassword(user.passwordHash, currentPassword);
      if (!isValidPassword) {
        throw createError.auth('Current password is incorrect');
      }

      // Validate new password strength
      if (!this.validatePasswordStrength(newPassword)) {
        throw createError.validation(
          'New password must be at least 8 characters long and contain uppercase, lowercase, number, and special character'
        );
      }

      // Hash new password
      const passwordHash = await this.hashPassword(newPassword);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash }
      });

      // Logout from all other devices
      await this.logoutAll(userId);

      authLogger.info('Password changed successfully', { userId });
    } catch (error) {
      authLogger.error('Password change failed', { userId, error });
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        // Don't reveal if user exists
        authLogger.warn('Password reset requested for non-existent user', { email });
        return;
      }

      // Generate reset token
      const resetToken = nanoid(32);
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Update user with reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpires: resetExpires
        }
      });

      // TODO: Send password reset email
      authLogger.info('Password reset requested', { userId: user.id, email });
    } catch (error) {
      authLogger.error('Password reset request failed', { email, error });
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // Find user with valid reset token
      const user = await prisma.user.findFirst({
        where: {
          passwordResetToken: token,
          passwordResetExpires: { gt: new Date() }
        }
      });

      if (!user) {
        throw createError.auth('Invalid or expired reset token');
      }

      // Validate new password strength
      if (!this.validatePasswordStrength(newPassword)) {
        throw createError.validation(
          'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character'
        );
      }

      // Hash new password
      const passwordHash = await this.hashPassword(newPassword);

      // Update password and clear reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordResetToken: null,
          passwordResetExpires: null
        }
      });

      // Logout from all devices
      await this.logoutAll(user.id);

      authLogger.info('Password reset completed', { userId: user.id });
    } catch (error) {
      authLogger.error('Password reset failed', { error });
      throw error;
    }
  }

  /**
   * Get user sessions
   */
  async getUserSessions(userId: string): Promise<SessionData[]> {
    try {
      const sessions = await prisma.session.findMany({
        where: {
          userId,
          isActive: true,
          expiresAt: { gt: new Date() }
        },
        orderBy: { createdAt: 'desc' }
      });

      return sessions;
    } catch (error) {
      authLogger.error('Failed to get user sessions', { userId, error });
      throw error;
    }
  }

  /**
   * Revoke specific session
   */
  async revokeSession(sessionId: string, userId: string): Promise<void> {
    try {
      await prisma.session.updateMany({
        where: {
          id: sessionId,
          userId
        },
        data: { isActive: false }
      });

      authLogger.info('Session revoked', { sessionId, userId });
    } catch (error) {
      authLogger.error('Session revocation failed', { sessionId, userId, error });
      throw error;
    }
  }
}

/**
 * Export singleton instance
 */
export const authService = new AuthService();
export default authService; 