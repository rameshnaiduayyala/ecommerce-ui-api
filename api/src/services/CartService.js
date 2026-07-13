import { BadRequestError, NotFoundError } from "../utils/errors.js";

export class CartService {
  /**
   * @param {import("../repositories/CartRepository").CartRepository} cartRepository
   * @param {import("../repositories/ProductRepository").ProductRepository} productRepository
   * @param {import("../repositories/InventoryRepository").InventoryRepository} inventoryRepository
   */
  constructor(cartRepository, productRepository, inventoryRepository) {
    this.cartRepository = cartRepository;
    this.productRepository = productRepository;
    this.inventoryRepository = inventoryRepository;
  }

  async getOrCreateCart(userId = null, cartId = null) {
    if (userId) {
      let cart = await this.cartRepository.findActiveByUserId(userId);
      if (!cart) {
        cart = await this.cartRepository.createCart(userId);
      }
      return cart;
    }

    if (cartId) {
      const cart = await this.cartRepository.findById(cartId);
      if (cart && cart.status === "ACTIVE") {
        return cart;
      }
    }

    return this.cartRepository.createCart(null);
  }

  async addItemToCart({ userId, cartId, variantId, quantity }) {
    const cart = await this.getOrCreateCart(userId, cartId);
    
    // 1. Verify variant exists and fetch price
    const variant = await this.productRepository.findVariantById(variantId);
    if (!variant || variant.status !== "ACTIVE") {
      throw new NotFoundError("Product variant not found or inactive.");
    }

    // 2. Verify stock levels
    const stockItems = await this.inventoryRepository.findStockByVariant(variantId);
    const totalAvailable = stockItems.reduce((acc, curr) => acc + curr.availableStock, 0);

    const existingItem = await this.cartRepository.findItemInCart(cart.id, variantId);
    const currentQtyInCart = existingItem ? existingItem.quantity : 0;
    const requestedQty = currentQtyInCart + quantity;

    if (totalAvailable < requestedQty) {
      throw new BadRequestError(`Insufficient stock available. Only ${totalAvailable} units available.`);
    }

    // 3. Insert or update quantity
    if (existingItem) {
      await this.cartRepository.updateItemQuantity(existingItem.id, requestedQty);
    } else {
      await this.cartRepository.createItem(cart.id, variantId, quantity, variant.price);
    }

    return this.cartRepository.findById(cart.id);
  }

  async updateItemQuantity(itemId, quantity) {
    if (quantity <= 0) {
      await this.cartRepository.removeItem(itemId);
      return;
    }

    // Verify stock levels before increasing
    const item = await this.prismaFindCartItem(itemId);
    if (!item) {
      throw new NotFoundError("Cart item not found.");
    }

    const stockItems = await this.inventoryRepository.findStockByVariant(item.variantId);
    const totalAvailable = stockItems.reduce((acc, curr) => acc + curr.availableStock, 0);

    if (totalAvailable < quantity) {
      throw new BadRequestError(`Insufficient stock available. Maximum available is ${totalAvailable} units.`);
    }

    await this.cartRepository.updateItemQuantity(itemId, quantity);
  }

  async removeItem(itemId) {
    await this.cartRepository.removeItem(itemId);
  }

  /**
   * Merges items from a guest cart into the customer's authenticated cart.
   */
  async mergeCarts(guestCartId, userId) {
    const guestCart = await this.cartRepository.findById(guestCartId);
    if (!guestCart || guestCart.status !== "ACTIVE") {
      return this.getOrCreateCart(userId);
    }

    const userCart = await this.getOrCreateCart(userId);

    for (const item of guestCart.items) {
      const existingUserItem = userCart.items.find((i) => i.variantId === item.variantId);
      
      // Calculate merge quantity
      const newQty = existingUserItem ? existingUserItem.quantity + item.quantity : item.quantity;

      // Verify stock holds
      const stockItems = await this.inventoryRepository.findStockByVariant(item.variantId);
      const totalAvailable = stockItems.reduce((acc, curr) => acc + curr.availableStock, 0);
      const targetQty = Math.min(newQty, totalAvailable);

      if (existingUserItem) {
        await this.cartRepository.updateItemQuantity(existingUserItem.id, targetQty);
      } else {
        await this.cartRepository.createItem(userCart.id, item.variantId, targetQty, item.priceAtAdded);
      }
    }

    // Delete guest cart
    await this.cartRepository.deleteCart(guestCartId);

    return this.cartRepository.findById(userCart.id);
  }

  // Wishlist actions
  async getWishlist(userId) {
    return this.cartRepository.findWishlistByUser(userId);
  }

  async addToWishlist(userId, variantId) {
    const variant = await this.productRepository.findVariantById(variantId);
    if (!variant) {
      throw new NotFoundError("Product variant not found.");
    }
    return this.cartRepository.addToWishlist(userId, variantId);
  }

  async removeFromWishlist(userId, variantId) {
    return this.cartRepository.removeFromWishlist(userId, variantId);
  }

  // Helper because repository does not directly expose this find
  async prismaFindCartItem(itemId) {
    // Standard access via prisma inside service context or create helper
    return this.cartRepository.prisma.cartItem.findUnique({
      where: { id: itemId }
    });
  }
}
