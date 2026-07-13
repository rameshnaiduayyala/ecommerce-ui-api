import { z } from "zod";
import { formatResponse } from "../utils/response.js";

// Zod validation schemas
const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  parentId: z.string().uuid().optional().nullable(),
  isFeatured: z.boolean().optional(),
  sortOrder: z.number().int().optional()
});

const brandSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  logo: z.string().optional(),
  banner: z.string().optional(),
  description: z.string().optional()
});

const imageInputSchema = z.object({
  url: z.string().url(),
  altText: z.string().optional(),
  type: z.enum(["THUMBNAIL", "GALLERY", "THREE_SIXTY"]).optional(),
  sortOrder: z.number().int().optional()
});

const variantInputSchema = z.object({
  sku: z.string().min(1),
  price: z.number().positive(),
  weight: z.number().optional(),
  barcode: z.string().optional(),
  attributeValues: z.record(z.string()),
  images: z.array(imageInputSchema).optional()
});

const attributeSchema = z.object({
  name: z.string().min(1),
  values: z.array(z.string())
});

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  baseSku: z.string().min(1),
  barcode: z.string().optional(),
  basePrice: z.number().positive(),
  discountPrice: z.number().optional(),
  hsn: z.string().optional(),
  gst: z.number().optional(),
  brandId: z.string().uuid().optional().nullable(),
  categories: z.array(z.string().uuid()).optional(),
  images: z.array(imageInputSchema).optional(),
  attributes: z.array(attributeSchema).optional(),
  variants: z.array(variantInputSchema).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "HIDDEN", "ARCHIVED"]).optional()
});

export class CatalogController {
  /**
   * @param {import("../services/ProductService").ProductService} productService
   */
  constructor(productService) {
    this.productService = productService;
  }

  // Categories
  async createCategory(request, reply) {
    const validated = categorySchema.parse(request.body);
    const category = await this.productService.createCategory(validated);
    return formatResponse(true, "Category created successfully.", category);
  }

  async getCategoriesTree(request, reply) {
    const tree = await this.productService.getCategoriesTree();
    return formatResponse(true, "Categories tree fetched successfully.", tree);
  }

  async deleteCategory(request, reply) {
    const { id } = request.params;
    await this.productService.categoryRepository.delete(id);
    return formatResponse(true, "Category deleted successfully.");
  }

  // Brands
  async createBrand(request, reply) {
    const validated = brandSchema.parse(request.body);
    const brand = await this.productService.createBrand(validated);
    return formatResponse(true, "Brand created successfully.", brand);
  }

  async getBrands(request, reply) {
    const brands = await this.productService.getBrands();
    return formatResponse(true, "Brands fetched successfully.", brands);
  }

  // Products
  async createProduct(request, reply) {
    const validated = productSchema.parse(request.body);
    const product = await this.productService.createProduct(validated);
    return reply.status(211).send(formatResponse(true, "Product created successfully.", product));
  }

  async getProducts(request, reply) {
    const { query } = request;
    const filters = {
      search: query.search,
      categoryId: query.categoryId,
      brandId: query.brandId,
      minPrice: query.minPrice ? parseFloat(query.minPrice) : undefined,
      maxPrice: query.maxPrice ? parseFloat(query.maxPrice) : undefined,
      status: query.status,
      skip: query.skip ? parseInt(query.skip, 10) : undefined,
      take: query.take ? parseInt(query.take, 10) : undefined,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder
    };

    const { items, total } = await this.productService.getProducts(filters);
    
    return formatResponse(true, "Products fetched successfully.", items, {
      total,
      skip: filters.skip || 0,
      take: filters.take || 20
    });
  }

  async getProductBySlug(request, reply) {
    const { slug } = request.params;
    const product = await this.productService.getProductBySlug(slug);
    return formatResponse(true, "Product fetched successfully.", product);
  }

  async updateProduct(request, reply) {
    const { id } = request.params;
    const validated = productSchema.partial().parse(request.body);
    const product = await this.productService.updateProduct(id, validated);
    return formatResponse(true, "Product updated successfully.", product);
  }

  async deleteProduct(request, reply) {
    const { id } = request.params;
    await this.productService.deleteProduct(id);
    return formatResponse(true, "Product deleted successfully.");
  }
}
