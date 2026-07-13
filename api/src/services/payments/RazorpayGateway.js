import { PaymentGateway } from "./PaymentGateway.js";
import { config } from "../../config/index.js";

export class RazorpayGateway extends PaymentGateway {
  constructor() {
    super();
    this.keyId = config.payment.razorpay.keyId;
    this.keySecret = config.payment.razorpay.keySecret;
  }

  async createCharge(amount, currency, orderId) {
    console.log(`[MOCK RAZORPAY] Created order reference for Order ${orderId}: Amount: ${currency} ${amount}`);
    return {
      id: `mock_rzp_order_${Date.now()}`,
      amount: amount * 100, // Razorpay in paisa
      currency,
      gateway: "RAZORPAY"
    };
  }

  async verifyPayment(payload, headers) {
    if (payload.razorpay_order_id && payload.razorpay_order_id.startsWith("mock_rzp_order_")) {
      return {
        verified: true,
        orderId: payload.orderId,
        status: "PAID",
        gatewayTxnId: payload.razorpay_payment_id || `mock_rzp_pay_${Date.now()}`
      };
    }

    return {
      verified: false,
      orderId: null,
      status: "FAILED",
      gatewayTxnId: null
    };
  }

  async refundCharge(gatewayTxnId, amount) {
    console.log(`[MOCK RAZORPAY] Refunding Txn: ${gatewayTxnId}, Amount: ${amount}`);
    return {
      refundId: `mock_rzp_ref_${Date.now()}`,
      status: "processed"
    };
  }
}
export default RazorpayGateway;
