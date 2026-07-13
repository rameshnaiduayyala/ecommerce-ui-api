export class ProductRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async create(data) {
    const { categories, images, attributes, variants, ...productData } = data;

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Core Product
      const product = await tx.product.create({
        data: {
          ...productData,
          categories: categories ? {
            create: categories.map((catId) => ({ categoryId: catId }))
          } : undefined,
          images: images ? {
            create: images.filter((img) => !img.variantSku) // global images only
          } : undefined,
          attributes: attributes ? {
            create: attributes
          } : undefined
        }
      });

      // 2. Create Variants and associate their specific images
      if (variants) {
        for (const variantInput of variants) {
          const { images: variantImages, ...vData } = variantInput;
          
          const variant = await tx.productVariant.create({
            data: {
              ...vData,
              productId: product.id
            }
          });

          // If variant has specific images, create them
          if (variantImages && variantImages.length > 0) {
            await tx.productImage.createMany({
              data: variantImages.map((img) => ({
                productId: product.id,
                variantId: variant.id,
                url: img.url,
                altText: img.altText,
                type: img.type || "GALLERY",
                sortOrder: img.sortOrder || 0
              }))
            });
          }
        }
      }

      return tx.product.findUnique({
        where: { id: product.id },
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          attributes: true,
          variants: {
            include: {
              images: true
            }
          },
          categories: { include: { category: true } }
        }
      });
    });
  }

  async findMany({ search, categoryId, brandId, minPrice, maxPrice, status, skip = 0, take = 20, sortBy = "createdAt", sortOrder = "desc" }) {
    const where = {
      deletedAt: null,
      status: status || "PUBLISHED"
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { baseSku: { contains: search, mode: "insensitive" } }
      ];
    }

    if (brandId) {
      where.brandId = brandId;
    }

    if (categoryId) {
      where.categories = {
        some: {
          categoryId: categoryId
        }
      };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.basePrice = {};
      if (minPrice !== undefined) where.basePrice.gte = minPrice;
      if (maxPrice !== undefined) where.basePrice.lte = maxPrice;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: {
          brand: true,
          images: { orderBy: { sortOrder: "asc" } },
          attributes: true,
          variants: {
            include: {
              images: true
            }
          },
          categories: { include: { category: true } }
        },
        skip,
        take,
        orderBy: {
          [sortBy]: sortOrder
        }
      }),
      this.prisma.product.count({ where })
    ]);

    return { items, total };
  }

  async findById(id) {
    return this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        brand: true,
        images: { orderBy: { sortOrder: "asc" } },
        attributes: true,
        variants: {
          include: {
            images: true
          }
        },
        categories: { include: { category: true } }
      }
    });
  }

  async findBySlug(slug) {
    return this.prisma.product.findFirst({
      where: { slug, deletedAt: null },
      include: {
        brand: true,
        images: { orderBy: { sortOrder: "asc" } },
        attributes: true,
        variants: {
          include: {
            images: true
          }
        },
        categories: { include: { category: true } }
      }
    });
  }

  async update(id, updateData) {
    const { categories, images, attributes, variants, ...productData } = updateData;

    return this.prisma.$transaction(async (tx) => {
      // 1. Update core product fields
      await tx.product.update({
        where: { id },
        data: productData
      });

      // 2. Rebuild Category Links
      if (categories) {
        await tx.productCategory.deleteMany({ where: { productId: id } });
        await tx.productCategory.createMany({
          data: categories.map((catId) => ({ productId: id, categoryId: catId }))
        });
      }

      // 3. Rebuild global product images (exclude variant-linked images)
      if (images) {
        await tx.productImage.deleteMany({ where: { productId: id, variantId: null } });
        await tx.productImage.createMany({
          data: images.map((img) => ({ ...img, productId: id, variantId: null }))
        });
      }

      // 4. Update attributes
      if (attributes) {
        await tx.productAttribute.deleteMany({ where: { productId: id } });
        await tx.productAttribute.createMany({
          data: attributes.map((attr) => ({ ...attr, productId: id }))
        });
      }

      // 5. Update variants and their specific images
      if (variants) {
        // Delete older variants and their associated variant-specific images
        await tx.productImage.deleteMany({
          where: { productId: id, NOT: { variantId: null } }
        });
        await tx.productVariant.deleteMany({ where: { productId: id } });

        for (const variantInput of variants) {
          const { images: variantImages, ...vData } = variantInput;

          const variant = await tx.productVariant.create({
            data: {
              ...vData,
              productId: id
            }
          });

          if (variantImages && variantImages.length > 0) {
            await tx.productImage.createMany({
              data: variantImages.map((img) => ({
                productId: id,
                variantId: variant.id,
                url: img.url,
                altText: img.altText,
                type: img.type || "GALLERY",
                sortOrder: img.sortOrder || 0
              }))
            });
          }
        }
      }

      return tx.product.findUnique({
        where: { id },
        include: {
          brand: true,
          images: { orderBy: { sortOrder: "asc" } },
          attributes: true,
          variants: {
            include: {
              images: true
            }
          },
          categories: { include: { category: true } }
        }
      });
    });
  }

  async delete(id) {
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  // Variant operations
  async findVariantById(variantId) {
    return this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: {
        product: true
      }
    });
  }

  async findVariantBySku(sku) {
    return this.prisma.productVariant.findUnique({
      where: { sku },
      include: {
        product: true
      }
    });
  }
}
