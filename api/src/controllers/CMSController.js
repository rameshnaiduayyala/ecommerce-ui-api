import { z } from "zod";
import { formatResponse } from "../utils/response.js";

const pageSchema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  content: z.string().min(1),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
  isPublished: z.boolean().default(true)
});

const blogSchema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  summary: z.string().optional(),
  content: z.string().min(1),
  image: z.string().optional(),
  author: z.string().optional(),
  isPublished: z.boolean().default(true)
});

const faqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  category: z.string().min(1),
  sortOrder: z.number().int().default(0)
});

export class CMSController {
  /**
   * @param {import("../services/CMSService").CMSService} cmsService
   */
  constructor(cmsService) {
    this.cmsService = cmsService;
  }

  // Pages
  async createPage(request, reply) {
    const validated = pageSchema.parse(request.body);
    const page = await this.cmsService.createPage(validated);
    return reply.status(211).send(formatResponse(true, "Page created successfully.", page));
  }

  async getPage(request, reply) {
    const { slug } = request.params;
    const page = await this.cmsService.getPage(slug);
    return formatResponse(true, "Page fetched.", page);
  }

  async getPages(request, reply) {
    const list = await this.cmsService.getPages();
    return formatResponse(true, "Pages list fetched.", list);
  }

  // Blogs
  async createBlog(request, reply) {
    const validated = blogSchema.parse(request.body);
    const blog = await this.cmsService.createBlog(validated);
    return reply.status(211).send(formatResponse(true, "Blog post created successfully.", blog));
  }

  async getBlog(request, reply) {
    const { slug } = request.params;
    const blog = await this.cmsService.getBlog(slug);
    return formatResponse(true, "Blog post fetched.", blog);
  }

  async getBlogs(request, reply) {
    const list = await this.cmsService.getBlogs();
    return formatResponse(true, "Blog list fetched.", list);
  }

  // FAQs
  async createFaq(request, reply) {
    const validated = faqSchema.parse(request.body);
    const faq = await this.cmsService.createFaq(validated);
    return reply.status(211).send(formatResponse(true, "FAQ item created successfully.", faq));
  }

  async getFaqs(request, reply) {
    const list = await this.cmsService.getFaqs();
    return formatResponse(true, "FAQs list fetched.", list);
  }

  // Settings
  async getSettings(request, reply) {
    const prisma = this.cmsService.cmsRepository.prisma;
    const settingsList = await prisma.setting.findMany();
    
    const settingsMap = {};
    settingsList.forEach(s => {
      if (s.value && typeof s.value === 'object') {
        if ('text' in s.value) settingsMap[s.key] = s.value.text;
        else if ('enabled' in s.value) settingsMap[s.key] = s.value.enabled;
        else if ('rate' in s.value) settingsMap[s.key] = s.value.rate;
        else if ('currency' in s.value) {
          settingsMap[s.key] = s.value.currency;
          settingsMap[s.key + '_symbol'] = s.value.symbol;
        } else {
          settingsMap[s.key] = s.value;
        }
      } else {
        settingsMap[s.key] = s.value;
      }
    });

    const finalSettings = {
      cod_enabled: settingsMap['cod_enabled'] !== undefined ? settingsMap['cod_enabled'] : true,
      partial_payment_enabled: settingsMap['partial_payment_enabled'] !== undefined ? settingsMap['partial_payment_enabled'] : false,
      partial_payment_percent: settingsMap['partial_payment_percent'] !== undefined ? settingsMap['partial_payment_percent'] : 50,
      shipping_fee: settingsMap['shipping_fee'] !== undefined ? settingsMap['shipping_fee'] : 50,
      free_shipping_threshold: settingsMap['free_shipping_threshold'] !== undefined ? settingsMap['free_shipping_threshold'] : 999,
      support_email: settingsMap['support_email'] || 'admin@rameshayyala.online',
      store_name: settingsMap['store_name'] || 'Aha Konaseema'
    };

    return formatResponse(true, "Store settings fetched.", finalSettings);
  }

  async updateSettings(request, reply) {
    const prisma = this.cmsService.cmsRepository.prisma;
    const updates = request.body;
    
    for (const key of Object.keys(updates)) {
      const val = updates[key];
      await prisma.setting.upsert({
        where: { key },
        update: { value: val },
        create: { key, value: val, group: "GENERAL" }
      });
    }

    return formatResponse(true, "Settings updated successfully.");
  }
}
export default CMSController;
