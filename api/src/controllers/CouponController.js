import { z } from "zod";
import { formatResponse } from "../utils/response.js";

const couponSchema = z.object({
  code: z.string().min(1).toUpperCase(),
  type: z.enum(["PERCENTAGE", "FLAT", "FREE_SHIPPING", "BOGO"]),
  value: z.number().positive(),
  minOrderAmount: z.number().nonnegative().default(0),
  maxDiscountAmount: z.number().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().default(1),
  startsAt: z.string(),
  expiresAt: z.string()
});

const validateSchema = z.object({
  code: z.string().min(1),
  subtotal: z.number().positive()
});

const toggleSchema = z.object({
  active: z.boolean()
});

export class CouponController {
  /**
   * @param {import("../services/CouponService").CouponService} couponService
   */
  constructor(couponService) {
    this.couponService = couponService;
  }

  async createCoupon(request, reply) {
    const validated = couponSchema.parse(request.body);
    const coupon = await this.couponService.createCoupon(validated);
    return reply.status(211).send(formatResponse(true, "Coupon created successfully.", coupon));
  }

  async getCoupons(request, reply) {
    const list = await this.couponService.getCoupons();
    return formatResponse(true, "Coupons retrieved successfully.", list);
  }

  async validateCoupon(request, reply) {
    const validated = validateSchema.parse(request.body);
    const userId = request.user?.id || null;

    const coupon = await this.couponService.validateCoupon(
      validated.code,
      validated.subtotal,
      userId
    );

    return formatResponse(true, "Coupon is valid.", coupon);
  }

  async toggleCoupon(request, reply) {
    const { id } = request.params;
    const validated = toggleSchema.parse(request.body);

    const coupon = await this.couponService.toggleCoupon(id, validated.active);
    return formatResponse(true, `Coupon status updated.`, coupon);
  }
}
export default CouponController;
