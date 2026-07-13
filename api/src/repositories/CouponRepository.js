export class CouponRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async create(data) {
    return this.prisma.coupon.create({ data });
  }

  async findByCode(code) {
    return this.prisma.coupon.findUnique({
      where: { code }
    });
  }

  async findById(id) {
    return this.prisma.coupon.findUnique({
      where: { id }
    });
  }

  async findMany(filters = {}) {
    return this.prisma.coupon.findMany({
      where: filters,
      orderBy: { createdAt: "desc" }
    });
  }

  async update(id, data) {
    return this.prisma.coupon.update({
      where: { id },
      data
    });
  }
}
export default CouponRepository;
