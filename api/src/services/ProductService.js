import { BadRequestError, NotFoundError } from "../utils/errors.js";

export class ProductService {
  /**
   * @param {import("../repositories/ProductRepository").ProductRepository} productRepository
   * @param {import("../repositories/CategoryRepository").CategoryRepository} categoryRepository
   * @param {import("../repositories/BrandRepository").BrandRepository} brandRepository
   */
  constructor(productRepository, categoryRepository, brandRepository) {
    this.productRepository = productRepository;
    this.categoryRepository = categoryRepository;
    this.brandRepository = brandRepository;
  }

  // 1. Categories Management & Hierarchical Tree Build
  async createCategory(data) {
    const slug = data.slug || this.slugify(data.name);
    
    // Check slug uniqueness
    const existing = await this.categoryRepository.findBySlug(slug);
    if (existing) {
      throw new BadRequestError(`Category slug '${slug}' is already taken.`);
    }

    return this.categoryRepository.create({ ...data, slug });
  }

  async getCategoriesTree() {
    const categories = await this.categoryRepository.findMany();
    return this.buildTree(categories, null);
  }

  buildTree(nodes, parentId = null) {
    const tree = [];
    for (const node of nodes) {
      if (node.parentId === parentId) {
        const children = this.buildTree(nodes, node.id);
        tree.push({
          ...node,
          children: children.length > 0 ? children : undefined
        });
      }
    }
    return tree;
  }

  // 2. Brand Operations
  async createBrand(data) {
    const slug = data.slug || this.slugify(data.name);
    
    const existing = await this.brandRepository.findBySlug(slug);
    if (existing) {
      throw new BadRequestError(`Brand slug '${slug}' is already taken.`);
    }

    return this.brandRepository.create({ ...data, slug });
  }

  async getBrands(filters = {}) {
    return this.brandRepository.findMany(filters);
  }

  // 3. Product Operations
  async createProduct(data) {
    const slug = data.slug || this.slugify(data.name);

    const existing = await this.productRepository.findBySlug(slug);
    if (existing) {
      throw new BadRequestError(`Product slug '${slug}' is already taken.`);
    }

    const product = await this.productRepository.create({ ...data, slug });
    return product;
  }

  async getProducts(filters) {
    return this.productRepository.findMany(filters);
  }

  async getProductBySlug(slug) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slug);
    const product = isUuid
      ? await this.productRepository.findById(slug)
      : await this.productRepository.findBySlug(slug);
    if (!product) {
      throw new NotFoundError(`Product with slug or id '${slug}' not found.`);
    }
    return product;
  }

  async updateProduct(id, updateData) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundError(`Product with id '${id}' not found.`);
    }

    const updated = await this.productRepository.update(id, updateData);
    return updated;
  }

  async deleteProduct(id) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundError(`Product with id '${id}' not found.`);
    }

    await this.productRepository.delete(id);
  }

  // Utilities
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
