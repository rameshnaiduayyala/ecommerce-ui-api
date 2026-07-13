import { z } from "zod";
import { formatResponse } from "../utils/response.js";

const reviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().optional(),
  comment: z.string().optional()
});

const moderateSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"])
});

export class ReviewController {
  /**
   * @param {import("../services/ReviewService").ReviewService} reviewService
   */
  constructor(reviewService) {
    this.reviewService = reviewService;
  }

  async createReview(request, reply) {
    const validated = reviewSchema.parse(request.body);
    const userId = request.user.id;

    const review = await this.reviewService.addReview(userId, validated);
    return reply.status(211).send(formatResponse(true, "Review submitted for moderation approval.", review));
  }

  async getProductReviews(request, reply) {
    const { productId } = request.params;
    const { page, limit } = request.query;
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 20;

    const list = await this.reviewService.getProductReviews(productId, p, l);
    return formatResponse(true, "Product reviews list fetched.", list);
  }

  async moderate(request, reply) {
    const { id } = request.params;
    const validated = moderateSchema.parse(request.body);

    const review = await this.reviewService.moderateReview(id, validated.status);
    return formatResponse(true, `Review status set to ${validated.status}.`, review);
  }
}
export default ReviewController;
