import { z } from "zod";
import { formatResponse } from "../utils/response.js";
import { BadRequestError } from "../utils/errors.js";

// Zod Request Validation Schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/, "Must contain at least one uppercase letter").regex(/[a-z]/, "Must contain at least one lowercase letter").regex(/[0-9]/, "Must contain at least one number"),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  roleId: z.string().uuid().optional()
});

const addressSchema = z.object({
  addressName: z.string().min(1).default("Default Address"),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional().nullable(),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(1).default("India"),
  postalCode: z.string().min(1),
  isDefault: z.boolean().optional().default(false)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  deviceId: z.string().optional(),
  deviceName: z.string().optional()
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1)
});

const otpRequestSchema = z.object({
  email: z.string().email()
});

const otpVerifySchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6)
});

export class AuthController {
  /**
   * @param {import("../services/AuthService").AuthService} authService
   */
  constructor(authService) {
    this.authService = authService;
  }

  async register(request, reply) {
    const validated = registerSchema.parse(request.body);
    const user = await this.authService.register(validated);
    return formatResponse(true, "User registered successfully.", user);
  }

  async login(request, reply) {
    const validated = loginSchema.parse(request.body);
    const ipAddress = request.ip;
    const userAgent = request.headers["user-agent"];

    const result = await this.authService.login(
      validated.email,
      validated.password,
      ipAddress,
      userAgent,
      validated.deviceId || null,
      validated.deviceName || null
    );

    return formatResponse(true, "Login successful.", result);
  }

  async refresh(request, reply) {
    const validated = refreshSchema.parse(request.body);
    const ipAddress = request.ip;
    const userAgent = request.headers["user-agent"];

    const result = await this.authService.refresh(
      validated.refreshToken,
      ipAddress,
      userAgent
    );

    return formatResponse(true, "Token refreshed successfully.", result);
  }

  async logout(request, reply) {
    const validated = refreshSchema.parse(request.body);
    await this.authService.logout(validated.refreshToken);
    return formatResponse(true, "Logout successful.");
  }

  async requestOtp(request, reply) {
    const validated = otpRequestSchema.parse(request.body);
    const otp = await this.authService.generateEmailVerificationOtp(validated.email);
    return formatResponse(true, "OTP code generated successfully.", { otp });
  }

  async verifyOtp(request, reply) {
    const validated = otpVerifySchema.parse(request.body);
    await this.authService.verifyEmailOtp(validated.email, validated.otp);
    return formatResponse(true, "OTP verification successful.");
  }

  // Address Management
  async getAddresses(request, reply) {
    const userId = request.user.id;
    const addresses = await this.authService.userRepository.prisma.address.findMany({
      where: { userId }
    });
    return formatResponse(true, "Addresses retrieved.", addresses);
  }

  async createAddress(request, reply) {
    const validated = addressSchema.parse(request.body);
    const userId = request.user.id;
    
    if (validated.isDefault) {
      await this.authService.userRepository.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false }
      });
    }

    const address = await this.authService.userRepository.prisma.address.create({
      data: {
        ...validated,
        userId
      }
    });
    return formatResponse(true, "Address created successfully.", address);
  }

  async updateAddress(request, reply) {
    const { id } = request.params;
    const validated = addressSchema.partial().parse(request.body);
    const userId = request.user.id;

    if (validated.isDefault) {
      await this.authService.userRepository.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false }
      });
    }

    const address = await this.authService.userRepository.prisma.address.update({
      where: { id, userId },
      data: validated
    });
    return formatResponse(true, "Address updated successfully.", address);
  }

  async deleteAddress(request, reply) {
    const { id } = request.params;
    const userId = request.user.id;
    await this.authService.userRepository.prisma.address.delete({
      where: { id, userId }
    });
    return formatResponse(true, "Address deleted successfully.");
  }

  async changePassword(request, reply) {
    const { password } = request.body;
    if (!password || password.length < 6) {
      throw new BadRequestError("Password must be at least 6 characters long.");
    }
    await this.authService.changePassword(request.user.id, password);
    return formatResponse(true, "Password updated successfully.");
  }
}
