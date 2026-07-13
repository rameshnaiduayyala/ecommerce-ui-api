import { BadRequestError, NotFoundError } from "../utils/errors.js";

export class InventoryService {
  /**
   * @param {import("../repositories/InventoryRepository").InventoryRepository} inventoryRepository
   */
  constructor(inventoryRepository) {
    this.inventoryRepository = inventoryRepository;
  }

  async createWarehouse(data) {
    return this.inventoryRepository.createWarehouse(data);
  }

  async getWarehouses() {
    return this.inventoryRepository.findWarehouses();
  }

  async adjustStock(warehouseId, variantId, qtyChange, actionType, notes) {
    const physicalChange = qtyChange;
    const reservedChange = 0;
    const availableChange = qtyChange;

    const inventory = await this.inventoryRepository.adjustStock(
      warehouseId,
      variantId,
      physicalChange,
      reservedChange,
      availableChange,
      actionType,
      notes
    );

    // Trigger low stock notifications or alerts if needed
    if (inventory.availableStock <= inventory.minStock) {
      console.warn(`[LOW STOCK ALERT] Variant ${variantId} in Warehouse ${warehouseId} has dropped to ${inventory.availableStock} items!`);
    }

    return inventory;
  }

  async transferStock(sourceWarehouseId, targetWarehouseId, variantId, quantity, notes) {
    if (sourceWarehouseId === targetWarehouseId) {
      throw new BadRequestError("Source and target warehouses cannot be identical.");
    }
    return this.inventoryRepository.createStockTransfer(
      sourceWarehouseId,
      targetWarehouseId,
      variantId,
      quantity,
      notes
    );
  }

  async receiveTransfer(transferId) {
    return this.inventoryRepository.executeStockTransferArrival(transferId);
  }

  async getProductStock(variantId) {
    return this.inventoryRepository.findStockByVariant(variantId);
  }

  async getStockHistory(warehouseId, variantId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    return this.inventoryRepository.getStockHistory(warehouseId, variantId, skip, limit);
  }
}
