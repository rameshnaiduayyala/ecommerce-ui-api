export class InventoryRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async createWarehouse(data) {
    return this.prisma.warehouse.create({ data });
  }

  async findWarehouses() {
    return this.prisma.warehouse.findMany({
      where: { status: "ACTIVE" }
    });
  }

  async findStockByVariant(variantId) {
    return this.prisma.inventory.findMany({
      where: { variantId },
      include: {
        warehouse: true
      }
    });
  }

  async findStockByWarehouseAndVariant(warehouseId, variantId) {
    return this.prisma.inventory.findUnique({
      where: {
        warehouseId_variantId: { warehouseId, variantId }
      }
    });
  }

  /**
   * Adjust stock levels atomically.
   */
  async adjustStock(warehouseId, variantId, physicalChange, reservedChange, availableChange, type, notes) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Atomically update inventory numbers
      const inventory = await tx.inventory.upsert({
        where: {
          warehouseId_variantId: { warehouseId, variantId }
        },
        update: {
          physicalStock: { increment: physicalChange },
          reservedStock: { increment: reservedChange },
          availableStock: { increment: availableChange }
        },
        create: {
          warehouseId,
          variantId,
          physicalStock: physicalChange,
          reservedStock: reservedChange,
          availableStock: availableChange
        }
      });

      // 2. Record audit trail in StockHistory
      await tx.stockHistory.create({
        data: {
          warehouseId,
          variantId,
          quantityChange: physicalChange !== 0 ? physicalChange : availableChange,
          type,
          notes
        }
      });

      return inventory;
    });
  }

  // Stock Transfer
  async createStockTransfer(sourceWarehouseId, targetWarehouseId, variantId, quantity, notes) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Reserve stock in source warehouse
      const sourceStock = await tx.inventory.findUnique({
        where: { warehouseId_variantId: { warehouseId: sourceWarehouseId, variantId } }
      });

      if (!sourceStock || sourceStock.availableStock < quantity) {
        throw new Error("Insufficient stock available for transfer.");
      }

      // Decrement source stock physical/available, and create transfer record
      await tx.inventory.update({
        where: { warehouseId_variantId: { warehouseId: sourceWarehouseId, variantId } },
        data: {
          physicalStock: { decrement: quantity },
          availableStock: { decrement: quantity }
        }
      });

      const transfer = await tx.stockTransfer.create({
        data: {
          sourceWarehouseId,
          targetWarehouseId,
          variantId,
          quantity,
          status: "PENDING",
          notes
        }
      });

      // Record source history log
      await tx.stockHistory.create({
        data: {
          warehouseId: sourceWarehouseId,
          variantId,
          quantityChange: -quantity,
          type: "TRANSFER",
          notes: `Stock transfer initiated. Ref: ${transfer.id}`
        }
      });

      return transfer;
    });
  }

  async executeStockTransferArrival(transferId) {
    return this.prisma.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.findUnique({
        where: { id: transferId }
      });

      if (!transfer || transfer.status !== "PENDING") {
        throw new Error("Invalid transfer record or transfer already processed.");
      }

      // Add to target warehouse stock
      await tx.inventory.upsert({
        where: {
          warehouseId_variantId: {
            warehouseId: transfer.targetWarehouseId,
            variantId: transfer.variantId
          }
        },
        update: {
          physicalStock: { increment: transfer.quantity },
          availableStock: { increment: transfer.quantity }
        },
        create: {
          warehouseId: transfer.targetWarehouseId,
          variantId: transfer.variantId,
          physicalStock: transfer.quantity,
          availableStock: transfer.quantity
        }
      });

      // Update transfer status
      const updatedTransfer = await tx.stockTransfer.update({
        where: { id: transferId },
        data: { status: "COMPLETED" }
      });

      // Record target history log
      await tx.stockHistory.create({
        data: {
          warehouseId: transfer.targetWarehouseId,
          variantId: transfer.variantId,
          quantityChange: transfer.quantity,
          type: "TRANSFER",
          notes: `Stock transfer received. Ref: ${transferId}`
        }
      });

      return updatedTransfer;
    });
  }

  async getStockHistory(warehouseId, variantId, skip = 0, take = 50) {
    return this.prisma.stockHistory.findMany({
      where: { warehouseId, variantId },
      orderBy: { createdAt: "desc" },
      skip,
      take
    });
  }
}
