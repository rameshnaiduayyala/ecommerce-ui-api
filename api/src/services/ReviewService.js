import { BadRequestError, NotFoundError } from "../utils/errors.js";

export class ReviewService {
  /**
   * @param {import("../repositories/ReviewRepository").ReviewRepository} reviewRepository
   */
  constructor(reviewRepository) {
    this.reviewRepository = reviewRepository;
  }

  async addReview(userId, data) {
    // Check if user has purchased the item to flag as verified purchase
    const ordersCount = await this.reviewRepository.prisma.order.count({
      where: {
        userId,
        status: "DELIVERED",
        items: {
          some: {
            variant: {
              productId: data.productId
            }
          }
        }
      }
    });

    const isVerifiedPurchase = ordersCount > 0;

    return this.reviewRepository.create({
      userId,
      productId: data.productId,
      rating: data.rating,
      title: data.title,
      comment: data.comment,
      isVerifiedPurchase,
      status: "PENDING" // Requires moderation by default
    });
  }

  async getProductReviews(productId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    return this.reviewRepository.findByProductId(productId, skip, limit);
  }

  async moderateReview(id, status) {
    const review = await this.reviewRepository.findById(id);
    if (!review) {
      throw new NotFoundError("Review not found.");
    }
    return this.reviewRepository.updateStatus(id, status);
  }
}
export default ReviewService;
