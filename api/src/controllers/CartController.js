import { z } from "zod";
import { formatResponse } from "../utils/response.js";

// Zod validations
const addToCartSchema = z.object({
  cartId: z.string().uuid().optional(),
  variantId: z.string().uuid(),
  quantity: z.number().int().positive().default(1)
});

const updateQuantitySchema = z.object({
  quantity: z.number().int().nonnegative()
});

const mergeCartSchema = z.object({
  guestCartId: z.string().uuid()
});

const wishlistSchema = z.object({
  variantId: z.string().uuid()
});

export class CartController {
  /**
   * @param {import("../services/CartService").CartService} cartService
   */
  constructor(cartService) {
    this.cartService = cartService;
  }

  async getCart(request, reply) {
    const userId = request.user?.id || null;
    const { cartId } = request.query;

    const cart = await this.cartService.getOrCreateCart(userId, cartId);
    return formatResponse(true, "Cart fetched successfully.", cart);
  }

  async addItem(request, reply) {
    const validated = addToCartSchema.parse(request.body);
    const userId = request.user?.id || null;

    const cart = await this.cartService.addItemToCart({
      userId,
      cartId: validated.cartId,
      variantId: validated.variantId,
      quantity: validated.quantity
    });

    return formatResponse(true, "Item added to cart successfully.", cart);
  }

  async updateItem(request, reply) {
    const { itemId } = request.params;
    const validated = updateQuantitySchema.parse(request.body);

    await this.cartService.updateItemQuantity(itemId, validated.quantity);
    return formatResponse(true, "Cart item updated successfully.");
  }

  async removeItem(request, reply) {
    const { itemId } = request.params;
    await this.cartService.removeItem(itemId);
    return formatResponse(true, "Cart item removed successfully.");
  }

  async mergeCart(request, reply) {
    const validated = mergeCartSchema.parse(request.body);
    const userId = request.user.id;

    const cart = await this.cartService.mergeCarts(validated.guestCartId, userId);
    return formatResponse(true, "Carts merged successfully.", cart);
  }

  // Wishlist
  async getWishlist(request, reply) {
    const userId = request.user.id;
    const items = await this.cartService.getWishlist(userId);
    return formatResponse(true, "Wishlist retrieved.", items);
  }

  async addToWishlist(request, reply) {
    const validated = wishlistSchema.parse(request.body);
    const userId = request.user.id;

    const result = await this.cartService.addToWishlist(userId, validated.variantId);
    return formatResponse(true, "Added to wishlist.", result);
  }

  async removeFromWishlist(request, reply) {
    const { variantId } = request.params;
    const userId = request.user.id;

    await this.cartService.removeFromWishlist(userId, variantId);
    return formatResponse(true, "Removed from wishlist.");
  }
}
