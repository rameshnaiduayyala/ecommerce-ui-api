export class CMSRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  // Pages
  async createPage(data) {
    return this.prisma.cMSPage.create({ data });
  }

  async findPageBySlug(slug) {
    return this.prisma.cMSPage.findUnique({
      where: { slug }
    });
  }

  async findPages() {
    return this.prisma.cMSPage.findMany();
  }

  // Blogs
  async createBlog(data) {
    return this.prisma.cMSBlog.create({ data });
  }

  async findBlogBySlug(slug) {
    return this.prisma.cMSBlog.findUnique({
      where: { slug }
    });
  }

  async findBlogs() {
    return this.prisma.cMSBlog.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" }
    });
  }

  // FAQs
  async createFaq(data) {
    return this.prisma.fAQ.create({ data });
  }

  async findFaqs() {
    return this.prisma.fAQ.findMany({
      orderBy: { sortOrder: "asc" }
    });
  }
}
export default CMSRepository;
