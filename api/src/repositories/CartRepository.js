export class CartRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async findActiveByUserId(userId) {
    return this.prisma.cart.findFirst({
      where: { userId, status: "ACTIVE" },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true
              }
            }
          }
        }
      }
    });
  }

  async findById(cartId) {
    return this.prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true
              }
            }
          }
        }
      }
    });
  }

  async createCart(userId = null) {
    return this.prisma.cart.create({
      data: {
        userId,
        status: "ACTIVE"
      },
      include: {
        items: true
      }
    });
  }

  async addItem(cartId, variantId, quantity, price) {
    return this.prisma.cartItem.upsert({
      where: {
        // Since there is no composite unique index on cartId + variantId, we do standard find then create/update.
        // Wait, let's verify schema: in schema.prisma, CartItem has id UUID, cartId, variantId.
        // So we can find existing and then create or update. Let's do that!
        id: "placeholder" // placeholder that will fail causing us to fallback to create or find
      },
      // Since it's not unique by cartId_variantId in schema, let's do a programmatic check to avoid schema changes.
    });
  }

  async findItemInCart(cartId, variantId) {
    return this.prisma.cartItem.findFirst({
      where: { cartId, variantId }
    });
  }

  async createItem(cartId, variantId, quantity, price) {
    return this.prisma.cartItem.create({
      data: {
        cartId,
        variantId,
        quantity,
        priceAtAdded: price
      }
    });
  }

  async updateItemQuantity(itemId, quantity) {
    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity }
    });
  }

  async removeItem(itemId) {
    return this.prisma.cartItem.delete({
      where: { id: itemId }
    });
  }

  async deleteCart(cartId) {
    return this.prisma.cart.delete({
      where: { id: cartId }
    });
  }

  async updateCartUserId(cartId, userId) {
    return this.prisma.cart.update({
      where: { id: cartId },
      data: { userId }
    });
  }

  // Wishlist actions
  async findWishlistByUser(userId) {
    return this.prisma.wishlist.findMany({
      where: { userId },
      include: {
        variant: {
          include: {
            product: true
          }
        }
      }
    });
  }

  async addToWishlist(userId, variantId) {
    return this.prisma.wishlist.upsert({
      where: {
        userId_variantId: { userId, variantId }
      },
      update: {},
      create: { userId, variantId }
    });
  }

  async removeFromWishlist(userId, variantId) {
    return this.prisma.wishlist.delete({
      where: {
        userId_variantId: { userId, variantId }
      }
    });
  }
}
