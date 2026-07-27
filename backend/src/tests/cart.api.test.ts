import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app.js";
import { Cart } from "../models/Cart.js";
import { User } from "../models/User.js";
import { dummyjson } from "../services/product.service.js";

const app = createApp();
let mongoServer: MongoMemoryServer;

async function registerAndLogin(email: string) {
  const credentials = { email, password: "secure-password-123" };
  await request(app).post("/api/auth/register").send({
    name: "Cart Tester",
    ...credentials,
  });
  const response = await request(app).post("/api/auth/login").send(credentials);

  return response.body.data.accessToken as string;
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

beforeEach(async () => {
  await Promise.all([User.deleteMany({}), Cart.deleteMany({})]);
  vi.restoreAllMocks();
  vi.spyOn(dummyjson, "get").mockResolvedValue({
    data: {
      id: 1,
      title: "Essence Mascara Lash Princess",
      price: 9.99,
      thumbnail: "https://example.com/product-1.png",
      rating: 4.94,
    },
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Cart API", () => {
  it("adds, persists, updates, reads, and removes cart items", async () => {
    const token = await registerAndLogin("cart@example.com");
    const authorization = { Authorization: `Bearer ${token}` };

    const addResponse = await request(app)
      .post("/api/cart/items")
      .set(authorization)
      .send({ productId: 1, quantity: 2 });
    expect(addResponse.status).toBe(201);
    expect(addResponse.body.data.cart).toMatchObject({
      totalItems: 2,
      totalPrice: 19.98,
    });

    const persistedCart = await Cart.findOne({});
    expect(persistedCart?.items[0]?.title).toBe(
      "Essence Mascara Lash Princess"
    );

    const updateResponse = await request(app)
      .patch("/api/cart/items/1")
      .set(authorization)
      .send({ quantity: 3 });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.cart.totalItems).toBe(3);

    const getResponse = await request(app).get("/api/cart").set(authorization);
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data.cart.items[0].quantity).toBe(3);

    const deleteResponse = await request(app)
      .delete("/api/cart/items/1")
      .set(authorization);
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.data.cart.totalItems).toBe(0);
  });

  it("clears the cart and isolates each user's data", async () => {
    const ownerToken = await registerAndLogin("cart-owner@example.com");
    const ownerAuthorization = { Authorization: `Bearer ${ownerToken}` };
    await request(app)
      .post("/api/cart/items")
      .set(ownerAuthorization)
      .send({ productId: 1, quantity: 1 });

    const otherToken = await registerAndLogin("cart-other@example.com");
    const otherCart = await request(app)
      .get("/api/cart")
      .set("Authorization", `Bearer ${otherToken}`);
    expect(otherCart.body.data.cart.totalItems).toBe(0);

    const clearResponse = await request(app)
      .delete("/api/cart")
      .set(ownerAuthorization);
    expect(clearResponse.status).toBe(200);
    expect(clearResponse.body.data.cart.items).toEqual([]);
  });

  it("protects routes and validates item input", async () => {
    const missingAuth = await request(app).get("/api/cart");
    expect(missingAuth.status).toBe(401);

    const token = await registerAndLogin("cart-validation@example.com");
    const invalidItem = await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: -1, quantity: 0 });
    expect(invalidItem.status).toBe(400);
    expect(invalidItem.body.message).toBe("Validation failed");
  });
});
