/**
 * Abstract Payment Gateway defining required operations.
 */
export class PaymentGateway {
  /**
   * Create a charge session (e.g. Stripe checkout or Razorpay order).
   *
   * @param {number} amount - Charge amount.
   * @param {string} currency - Base currency code.
   * @param {string} orderId - System order reference.
   * @returns {Promise<object>} Session configuration or reference parameters.
   */
  async createCharge(amount, currency, orderId) {
    throw new Error("Method 'createCharge' must be implemented.");
  }

  /**
   * Validates webhooks or callbacks from payment providers.
   *
   * @param {object} payload - Body/parameters sent from payment gateway.
   * @param {object} headers - HTTP headers for signature validation.
   * @returns {Promise<{ verified: boolean, orderId: string, status: string, gatewayTxnId: string }>}
   */
  async verifyPayment(payload, headers) {
    throw new Error("Method 'verifyPayment' must be implemented.");
  }

  /**
   * Initiates refund logic on a completed transaction.
   *
   * @param {string} gatewayTxnId - Reference ID from gateway.
   * @param {number} amount - Refund value.
   * @returns {Promise<object>} Details from provider.
   */
  async refundCharge(gatewayTxnId, amount) {
    throw new Error("Method 'refundCharge' must be implemented.");
  }
}
export default PaymentGateway;
