import { PaymentGateway } from "./PaymentGateway.js";
import { config } from "../../config/index.js";

export class StripeGateway extends PaymentGateway {
  constructor() {
    super();
    this.secretKey = config.payment.stripe.secretKey;
  }

  async createCharge(amount, currency, orderId) {
    if (!this.secretKey || this.secretKey.startsWith("sk_test_51")) {
      // Mock flow for test/local runs
      console.log(`[MOCK STRIPE] Created charge session for Order ${orderId}: Amount: ${currency} ${amount}`);
      return {
        id: `mock_stripe_sess_${Date.now()}`,
        url: `http://localhost:3000/payments/mock-stripe-checkout?orderId=${orderId}`,
        gateway: "STRIPE"
      };
    }

    // Real stripe client logic would go here
    // import Stripe from 'stripe';
    // const stripe = new Stripe(this.secretKey);
    // const session = await stripe.checkout.sessions.create({...});
    // return { id: session.id, url: session.url, gateway: 'STRIPE' };
    
    return {
      id: `stripe_sess_placeholder`,
      url: `https://stripe.com/checkout`,
      gateway: "STRIPE"
    };
  }

  async verifyPayment(payload, headers) {
    // If mock token is passed
    if (payload.session_id && payload.session_id.startsWith("mock_stripe_sess_")) {
      return {
        verified: true,
        orderId: payload.orderId,
        status: "PAID",
        gatewayTxnId: `mock_stripe_txn_${Date.now()}`
      };
    }

    // Real signature verify using Stripe SDK
    return {
      verified: false,
      orderId: null,
      status: "FAILED",
      gatewayTxnId: null
    };
  }

  async refundCharge(gatewayTxnId, amount) {
    console.log(`[MOCK STRIPE] Refunding Txn: ${gatewayTxnId}, Amount: ${amount}`);
    return {
      refundId: `mock_stripe_ref_${Date.now()}`,
      status: "succeeded"
    };
  }
}
