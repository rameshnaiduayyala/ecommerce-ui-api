export class ReviewRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async create(data) {
    return this.prisma.review.create({ data });
  }

  async findByProductId(productId, skip = 0, take = 20) {
    return this.prisma.review.findMany({
      where: { productId, status: "APPROVED" },
      include: {
        user: {
          select: { firstName: true, lastName: true }
        }
      },
      skip,
      take,
      orderBy: { createdAt: "desc" }
    });
  }

  async findById(id) {
    return this.prisma.review.findUnique({
      where: { id }
    });
  }

  async updateStatus(id, status) {
    return this.prisma.review.update({
      where: { id },
      data: { status }
    });
  }
}
export default ReviewRepository;
