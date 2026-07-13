import { BadRequestError, NotFoundError } from "../utils/errors.js";

export class CMSService {
  /**
   * @param {import("../repositories/CMSRepository").CMSRepository} cmsRepository
   */
  constructor(cmsRepository) {
    this.cmsRepository = cmsRepository;
  }

  // Pages
  async createPage(data) {
    const slug = data.slug || this.slugify(data.title);
    const existing = await this.cmsRepository.findPageBySlug(slug);
    if (existing) {
      throw new BadRequestError(`Page slug '${slug}' already exists.`);
    }
    return this.cmsRepository.createPage({ ...data, slug });
  }

  async getPage(slug) {
    const page = await this.cmsRepository.findPageBySlug(slug);
    if (!page) {
      throw new NotFoundError("Page not found.");
    }
    return page;
  }

  async getPages() {
    return this.cmsRepository.findPages();
  }

  // Blogs
  async createBlog(data) {
    const slug = data.slug || this.slugify(data.title);
    const existing = await this.cmsRepository.findBlogBySlug(slug);
    if (existing) {
      throw new BadRequestError(`Blog slug '${slug}' already exists.`);
    }
    return this.cmsRepository.createBlog({ ...data, slug });
  }

  async getBlog(slug) {
    const blog = await this.cmsRepository.findBlogBySlug(slug);
    if (!blog) {
      throw new NotFoundError("Blog post not found.");
    }
    return blog;
  }

  async getBlogs() {
    return this.cmsRepository.findBlogs();
  }

  // FAQs
  async createFaq(data) {
    return this.cmsRepository.createFaq(data);
  }

  async getFaqs() {
    return this.cmsRepository.findFaqs();
  }

  slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "");
  }
}
export default CMSService;
