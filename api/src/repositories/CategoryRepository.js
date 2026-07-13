export class CategoryRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async create(data) {
    return this.prisma.category.create({ data });
  }

  async findMany(filters = {}) {
    return this.prisma.category.findMany({
      where: {
        deletedAt: null,
        ...filters
      },
      orderBy: {
        sortOrder: "asc"
      }
    });
  }

  async findById(id) {
    return this.prisma.category.findFirst({
      where: { id, deletedAt: null },
      include: {
        parent: true,
        children: true
      }
    });
  }

  async findBySlug(slug) {
    return this.prisma.category.findFirst({
      where: { slug, deletedAt: null }
    });
  }

  async update(id, data) {
    return this.prisma.category.update({
      where: { id },
      data
    });
  }

  async delete(id) {
    return this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }
}
