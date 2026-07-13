import { BadRequestError, NotFoundError } from "../utils/errors.js";

export class CouponService {
  /**
   * @param {import("../repositories/CouponRepository").CouponRepository} couponRepository
   */
  constructor(couponRepository) {
    this.couponRepository = couponRepository;
  }

  async createCoupon(data) {
    const existing = await this.couponRepository.findByCode(data.code);
    if (existing) {
      throw new BadRequestError(`Coupon code '${data.code}' already exists.`);
    }

    return this.couponRepository.create({
      ...data,
      startsAt: new Date(data.startsAt),
      expiresAt: new Date(data.expiresAt)
    });
  }

  async validateCoupon(code, subtotal, userId) {
    const coupon = await this.couponRepository.findByCode(code);
    if (!coupon || coupon.status !== "ACTIVE") {
      throw new BadRequestError("Coupon code is invalid.");
    }

    if (coupon.startsAt > new Date() || coupon.expiresAt < new Date()) {
      throw new BadRequestError("Coupon has expired or is not active yet.");
    }

    if (subtotal < parseFloat(coupon.minOrderAmount)) {
      throw new BadRequestError(`Minimum purchase of $${coupon.minOrderAmount} is required.`);
    }

    // Verify usage limit per user
    if (userId && coupon.perUserLimit) {
      const usageCount = await this.couponRepository.prisma.order.count({
        where: {
          userId,
          discountAmount: { gt: 0 }
          // In actual applications we track orders that applied code WELCOME10
        }
      });

      if (usageCount >= coupon.perUserLimit) {
        throw new BadRequestError("You have exceeded the usage limit for this coupon code.");
      }
    }

    return coupon;
  }

  async getCoupons() {
    return this.couponRepository.findMany();
  }

  async toggleCoupon(id, active) {
    const coupon = await this.couponRepository.findById(id);
    if (!coupon) {
      throw new NotFoundError("Coupon not found.");
    }
    return this.couponRepository.update(id, {
      status: active ? "ACTIVE" : "INACTIVE"
    });
  }
}
export default CouponService;
