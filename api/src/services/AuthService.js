import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { 
  BadRequestError, 
  UnauthorizedError, 
  ConflictError 
} from "../utils/errors.js";

export class AuthService {
  /**
   * @param {import("../repositories/UserRepository").UserRepository} userRepository
   */
  constructor(userRepository) {
    this.userRepository = userRepository;
    this.otps = new Map();
  }

  async register(details) {
    // Check if user already exists
    const existing = await this.userRepository.findByEmail(details.email);
    if (existing) {
      throw new ConflictError("Email address is already registered.");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(details.password, 10);

    let roleId = details.roleId;
    if (!roleId) {
      const customerRole = await this.userRepository.prisma.role.findFirst({
        where: { name: "Customer" }
      });
      if (!customerRole) {
        throw new Error("Default Customer role not found in database.");
      }
      roleId = customerRole.id;
    }

    // Create user object
    const user = await this.userRepository.create({
      email: details.email,
      password: hashedPassword,
      firstName: details.firstName,
      lastName: details.lastName,
      phone: details.phone,
      roleId
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    };
  }

  async login(email, password, ipAddress, userAgent, deviceId, deviceName) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError("Invalid email or password.");
    }

    // Brute Force Lockout check
    if (user.status === "LOCKED") {
      if (user.lockUntil && user.lockUntil > new Date()) {
        const remainingMinutes = Math.ceil((user.lockUntil - new Date()) / 60000);
        throw new UnauthorizedError(`Account is temporarily locked. Try again in ${remainingMinutes} minutes.`);
      } else {
        // Lock time expired, unlock user automatically
        await this.userRepository.update(user.id, {
          status: "ACTIVE",
          loginAttempts: 0,
          lockUntil: null
        });
        user.status = "ACTIVE";
        user.loginAttempts = 0;
      }
    }

    // Verify Password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      // Increment login attempts
      const updatedAttempts = user.loginAttempts + 1;
      const maxAttempts = config.security.bruteForceMaxAttempts;

      if (updatedAttempts >= maxAttempts) {
        const lockUntil = new Date(Date.now() + config.security.accountLockDurationMins * 60000);
        await this.userRepository.update(user.id, {
          status: "LOCKED",
          loginAttempts: updatedAttempts,
          lockUntil
        });
        throw new UnauthorizedError(`Account has been locked due to too many failed attempts. Try again in ${config.security.accountLockDurationMins} minutes.`);
      } else {
        await this.userRepository.incrementLoginAttempts(user.id);
        throw new UnauthorizedError("Invalid email or password.");
      }
    }

    // Reset attempts on successful login
    if (user.loginAttempts > 0) {
      await this.userRepository.update(user.id, {
        loginAttempts: 0,
        lockUntil: null
      });
    }

    // Flatten permissions list from role permissions
    const permissions = user.role.rolePermissions.map((rp) => rp.permission.name);

    // Generate Access & Refresh Tokens
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role.name, permissions },
      config.jwt.accessSecret,
      { expiresIn: config.jwt.accessExpiry }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiry }
    );

    // Store Session in DB (Device tracking)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Matching 7d refresh token
    await this.userRepository.createSession({
      userId: user.id,
      refreshToken,
      ipAddress,
      userAgent,
      deviceId,
      deviceName,
      expiresAt
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name
      },
      tokens: {
        accessToken,
        refreshToken
      }
    };
  }

  async refresh(token, ipAddress, userAgent) {
    const session = await this.userRepository.findSessionByToken(token);
    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedError("Refresh token is invalid or expired.");
    }

    const user = session.user;
    const permissions = user.role.rolePermissions.map((rp) => rp.permission.name);

    // Generate new Access Token
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role.name, permissions },
      config.jwt.accessSecret,
      { expiresIn: config.jwt.accessExpiry }
    );

    // Rotate Refresh Token (JWT Rotation for security)
    const newRefreshToken = jwt.sign(
      { id: user.id },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiry }
    );

    // Invalidate old session
    await this.userRepository.invalidateSession(session.id);

    // Create new session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.userRepository.createSession({
      userId: user.id,
      refreshToken: newRefreshToken,
      ipAddress,
      userAgent,
      deviceId: session.deviceId,
      deviceName: session.deviceName,
      expiresAt
    });

    return {
      accessToken,
      refreshToken: newRefreshToken
    };
  }

  async logout(token) {
    const session = await this.userRepository.findSessionByToken(token);
    if (session) {
      await this.userRepository.invalidateSession(session.id);
    }
  }

  async generateEmailVerificationOtp(email) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // Cache OTP locally for 10 minutes
    this.otps.set(email, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000
    });
    
    // In a real application, email this code to the user. We will log it.
    console.log(`[EMAIL-OTP] Sent email verification OTP to ${email}: ${otp}`);
    return otp;
  }

  async verifyEmailOtp(email, otp) {
    const cached = this.otps.get(email);
    if (!cached || cached.otp !== otp || cached.expiresAt < Date.now()) {
      throw new BadRequestError("Invalid or expired OTP code.");
    }
    
    const user = await this.userRepository.findByEmail(email);
    if (user) {
      await this.userRepository.update(user.id, { isEmailVerified: true });
    }
    this.otps.delete(email);
  }

  async changePassword(userId, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(userId, { password: hashedPassword });
  }
}
