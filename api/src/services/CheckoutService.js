import { BadRequestError, NotFoundError } from "../utils/errors.js";

export class CheckoutService {
  /**
   * @param {import("../repositories/OrderRepository").OrderRepository} orderRepository
   * @param {import("../repositories/CartRepository").CartRepository} cartRepository
   */
  constructor(orderRepository, cartRepository) {
    this.orderRepository = orderRepository;
    this.cartRepository = cartRepository;
  }

  async calculateTotal({ cartId, couponCode, shippingAddressId, userId }) {
    const cart = await this.cartRepository.findById(cartId);
    if (!cart || cart.items.length === 0) {
      throw new BadRequestError("Shopping cart is empty or invalid.");
    }

    // 1. Calculate subtotal
    let subtotal = 0;
    for (const item of cart.items) {
      subtotal += parseFloat(item.priceAtAdded) * item.quantity;
    }

    // 2. Validate & Calculate Coupon Discount
    let discount = 0;
    let coupon = null;
    if (couponCode) {
      coupon = await this.cartRepository.prisma.coupon.findUnique({
        where: { code: couponCode, status: "ACTIVE" }
      });

      if (!coupon || coupon.startsAt > new Date() || coupon.expiresAt < new Date()) {
        throw new BadRequestError("Coupon code is invalid or has expired.");
      }

      if (subtotal < parseFloat(coupon.minOrderAmount)) {
        throw new BadRequestError(`Minimum order amount of $${coupon.minOrderAmount} is required for this coupon.`);
      }

      if (coupon.type === "PERCENTAGE") {
        discount = (subtotal * parseFloat(coupon.value)) / 100;
        if (coupon.maxDiscountAmount && discount > parseFloat(coupon.maxDiscountAmount)) {
          discount = parseFloat(coupon.maxDiscountAmount);
        }
      } else if (coupon.type === "FLAT") {
        discount = parseFloat(coupon.value);
      } else if (coupon.type === "FREE_SHIPPING") {
        // Handled in shipping calculations below
      }
      
      // Ensure discount doesn't exceed subtotal
      discount = Math.min(discount, subtotal);
    }

    // 3. Address validations
    const address = await this.cartRepository.prisma.address.findFirst({
      where: { id: shippingAddressId, userId }
    });
    if (!address) {
      throw new NotFoundError("Shipping address not found.");
    }

    // 4. Calculate Shipping and Taxes
    let shipping = coupon && coupon.type === "FREE_SHIPPING" ? 0 : 15.0; // Flat rate $15 shipping fee
    
    // Tax computation (18% flat rate for demo checkouts, or based on product HSN parameters)
    const taxRate = 0.18;
    const taxableAmount = Math.max(subtotal - discount, 0);
    const tax = taxableAmount * taxRate;

    const total = taxableAmount + tax + shipping;

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      discount: parseFloat(discount.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      shipping: parseFloat(shipping.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      cart,
      address
    };
  }

  async placeOrder({ cartId, couponCode, shippingAddressId, billingAddressId, paymentMethod, userId, currency = "INR", idempotencyKey = null }) {
    // 0. Idempotency check: prevent duplicate transactions
    if (idempotencyKey) {
      const existingOrder = await this.cartRepository.prisma.order.findFirst({
        where: { idempotencyKey, userId },
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
      if (existingOrder) {
        return existingOrder;
      }
    }

    // 1. Re-calculate order math to prevent price manipulation
    const bill = await this.calculateTotal({
      cartId,
      couponCode,
      shippingAddressId,
      userId
    });

    const { cart, address } = bill;
    const actualBillingId = billingAddressId || shippingAddressId;

    // Verify billing address exists
    const billingAddress = await this.cartRepository.prisma.address.findFirst({
      where: { id: actualBillingId, userId }
    });
    if (!billingAddress) {
      throw new NotFoundError("Billing address not found.");
    }

    // 2. Map cart items to order items structure
    const orderItems = cart.items.map((item) => {
      const unitPrice = parseFloat(item.priceAtAdded);
      const taxAmount = parseFloat((unitPrice * 0.18).toFixed(2));
      const totalAmount = parseFloat(((unitPrice + taxAmount) * item.quantity).toFixed(2));

      return {
        variantId: item.variantId,
        sku: item.variant.sku,
        name: item.variant.product.name,
        quantity: item.quantity,
        unitPrice,
        taxAmount,
        discountAmount: 0, // Split coupons across items if required, or assign at order level
        totalAmount
      };
    });

    // 3. Generate unique order number
    const timestamp = Date.now();
    const rand = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${timestamp}-${rand}`;

    // 4. Create Order (handles database inventory decrements inside atomic transaction)
    const orderData = {
      orderNumber,
      userId,
      status: "PENDING",
      currency,
      idempotencyKey,
      subtotal: bill.subtotal,
      taxAmount: bill.tax,
      shippingAmount: bill.shipping,
      discountAmount: bill.discount,
      totalAmount: bill.total,
      shippingAddressId,
      billingAddressId: actualBillingId,
      paymentStatus: "PENDING",
      paymentMethod
    };

    let order;
    try {
      order = await this.orderRepository.createOrder(orderData, orderItems);
    } catch (err) {
      throw new BadRequestError(err.message);
    }

    // 5. Empty the shopping cart
    await this.cartRepository.prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    });

    return order;
  }
}
