import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildServer } from "../server.js";

describe("Enterprise E-Commerce API Endpoints Integration", () => {
  let app;

  beforeAll(async () => {
    app = await buildServer();
    // Connect database and setups (Prisma connects automatically on server start)
  });

  afterAll(async () => {
    await app.close();
  });

  it("should successfully invoke health check endpoint", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/health"
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.message).toContain("healthy");
  });

  it("should fail authentication login with invalid credentials", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: {
        email: "non-existent@ecommerce.com",
        password: "WrongPassword123!"
      }
    });

    // Expecting 401 Unauthorized
    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.message).toContain("Invalid email or password");
  });

  it("should successfully retrieve categories public catalog", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/catalog/categories"
    });

    // If database is not seeded, it should still return 200 with empty list or seed items
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });
});
