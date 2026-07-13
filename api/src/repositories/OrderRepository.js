export class OrderRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async createOrder(orderData, itemsData) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Create order record
      const order = await tx.order.create({
        data: {
          ...orderData,
          items: {
            create: itemsData
          },
          statusHistory: {
            create: [
              { status: "PENDING", notes: "Order created." }
            ]
          }
        },
        include: {
          items: true,
          statusHistory: true
        }
      });

      // 2. Decrement available/physical inventory for each variant
      for (const item of itemsData) {
        // Find warehouse holding stock for this variant.
        // We select the warehouse that has stock and decrement.
        const stockRecord = await tx.inventory.findFirst({
          where: {
            variantId: item.variantId,
            availableStock: { gte: item.quantity }
          }
        });

        if (!stockRecord) {
          throw new Error(`Insufficient stock for variant sku ${item.sku}.`);
        }

        // Adjust stock level atomically (physical/available decrement, reserved increment or outright decrease)
        await tx.inventory.update({
          where: { id: stockRecord.id },
          data: {
            physicalStock: { decrement: item.quantity },
            availableStock: { decrement: item.quantity }
          }
        });

        // Record stock history log
        await tx.stockHistory.create({
          data: {
            warehouseId: stockRecord.warehouseId,
            variantId: item.variantId,
            quantityChange: -item.quantity,
            type: "SHIPPED",
            notes: `Sold in Order Ref: ${order.orderNumber}`
          }
        });
      }

      return order;
    });
  }

  async findById(orderId) {
    return this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true
              }
            }
          }
        },
        statusHistory: { orderBy: { createdAt: "desc" } },
        shippingAddress: true,
        billingAddress: true,
        transactions: true,
        shipments: true
      }
    });
  }

  async findByNumber(orderNumber) {
    return this.prisma.order.findFirst({
      where: { orderNumber },
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: "desc" } }
      }
    });
  }

  async findUserOrders(userId, skip = 0, take = 20) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where: { userId, deletedAt: null },
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
        },
        skip,
        take,
        orderBy: { createdAt: "desc" }
      }),
      this.prisma.order.count({ where: { userId, deletedAt: null } })
    ]);
    return { items, total };
  }

  async findAllOrders({ status, skip = 0, take = 20 }) {
    const where = { deletedAt: null };
    if (status) {
      where.status = status;
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
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
        },
        skip,
        take,
        orderBy: { createdAt: "desc" }
      }),
      this.prisma.order.count({ where })
    ]);
    return { items, total };
  }

  async updateOrderStatus(orderId, status, notes, updatedByUserId) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: orderId },
        data: { status }
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status,
          notes,
          updatedBy: updatedByUserId
        }
      });

      return order;
    });
  }

  async updatePaymentStatus(orderId, paymentStatus) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus }
    });
  }
}
