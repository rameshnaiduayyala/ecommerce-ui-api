import { z } from "zod";
import { formatResponse } from "../utils/response.js";

// Validator definitions
const warehouseSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  address: z.string().optional()
});

const stockAdjustmentSchema = z.object({
  warehouseId: z.string().uuid(),
  variantId: z.string().uuid(),
  quantity: z.number().int(),
  actionType: z.enum(["INCOMING", "RESERVED", "SHIPPED", "ADJUSTED", "TRANSFER"]),
  notes: z.string().optional()
});

const transferSchema = z.object({
  sourceWarehouseId: z.string().uuid(),
  targetWarehouseId: z.string().uuid(),
  variantId: z.string().uuid(),
  quantity: z.number().int().positive(),
  notes: z.string().optional()
});

export class InventoryController {
  /**
   * @param {import("../services/InventoryService").InventoryService} inventoryService
   */
  constructor(inventoryService) {
    this.inventoryService = inventoryService;
  }

  async createWarehouse(request, reply) {
    const validated = warehouseSchema.parse(request.body);
    const result = await this.inventoryService.createWarehouse(validated);
    return formatResponse(true, "Warehouse created successfully.", result);
  }

  async getWarehouses(request, reply) {
    const list = await this.inventoryService.getWarehouses();
    return formatResponse(true, "Warehouses list retrieved.", list);
  }

  async adjustStock(request, reply) {
    const validated = stockAdjustmentSchema.parse(request.body);
    const result = await this.inventoryService.adjustStock(
      validated.warehouseId,
      validated.variantId,
      validated.quantity,
      validated.actionType,
      validated.notes
    );
    return formatResponse(true, "Inventory levels updated successfully.", result);
  }

  async initiateTransfer(request, reply) {
    const validated = transferSchema.parse(request.body);
    const result = await this.inventoryService.transferStock(
      validated.sourceWarehouseId,
      validated.targetWarehouseId,
      validated.variantId,
      validated.quantity,
      validated.notes
    );
    return formatResponse(true, "Stock transfer initiated.", result);
  }

  async receiveTransfer(request, reply) {
    const { id } = request.params;
    const result = await this.inventoryService.receiveTransfer(id);
    return formatResponse(true, "Stock transfer received and processed.", result);
  }

  async getVariantStock(request, reply) {
    const { variantId } = request.params;
    const result = await this.inventoryService.getProductStock(variantId);
    return formatResponse(true, "Stock level per warehouse details retrieved.", result);
  }

  async getStockHistory(request, reply) {
    const { warehouseId, variantId } = request.params;
    const { page, limit } = request.query;
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 20;

    const result = await this.inventoryService.getStockHistory(warehouseId, variantId, p, l);
    return formatResponse(true, "Stock audit history trail retrieved.", result);
  }
}
