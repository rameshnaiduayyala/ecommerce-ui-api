import { StripeGateway } from "./StripeGateway.js";
import { RazorpayGateway } from "./RazorpayGateway.js";

class PaymentFactory {
  constructor() {
    this.gateways = {
      STRIPE: new StripeGateway(),
      RAZORPAY: new RazorpayGateway()
    };
  }

  /**
   * Resolves appropriate PaymentGateway driver.
   *
   * @param {string} provider - Gateway name (e.g. STRIPE, RAZORPAY).
   * @returns {import("./PaymentGateway").PaymentGateway}
   */
  getGateway(provider) {
    const gateway = this.gateways[provider.toUpperCase()];
    if (!gateway) {
      throw new Error(`Unsupported payment gateway provider: ${provider}`);
    }
    return gateway;
  }
}

export const paymentFactory = new PaymentFactory();
export default paymentFactory;
