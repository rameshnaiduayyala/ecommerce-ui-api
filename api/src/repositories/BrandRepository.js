export class BrandRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async create(data) {
    return this.prisma.brand.create({ data });
  }

  async findMany(filters = {}) {
    return this.prisma.brand.findMany({
      where: {
        deletedAt: null,
        ...filters
      },
      orderBy: {
        name: "asc"
      }
    });
  }

  async findById(id) {
    return this.prisma.brand.findFirst({
      where: { id, deletedAt: null }
    });
  }

  async findBySlug(slug) {
    return this.prisma.brand.findFirst({
      where: { slug, deletedAt: null }
    });
  }

  async update(id, data) {
    return this.prisma.brand.update({
      where: { id },
      data
    });
  }

  async delete(id) {
    return this.prisma.brand.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }
}
