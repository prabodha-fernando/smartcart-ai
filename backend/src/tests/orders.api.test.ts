import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app.js";
import { Cart } from "../models/Cart.js";
import { Order } from "../models/Order.js";
import { User } from "../models/User.js";
import { dummyjson } from "../services/product.service.js";

const app = createApp();
let mongoServer: MongoMemoryServer;

async function registerAndLogin(email: string) {
  const credentials = { email, password: "secure-password-123" };
  const registerResponse = await request(app).post("/api/auth/register").send({
    name: "Order Tester",
    ...credentials,
  });
  expect(registerResponse.status).toBe(201);

  const loginResponse = await request(app)
    .post("/api/auth/login")
    .send(credentials);
  expect(loginResponse.status).toBe(200);

  return loginResponse.body.data.accessToken as string;
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Cart.deleteMany({}),
    Order.deleteMany({}),
  ]);
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

describe("Orders API", () => {
  it("checks out a cart, snapshots it, clears it, and returns order history", async () => {
    const token = await registerAndLogin("orders@example.com");
    const authorization = { Authorization: `Bearer ${token}` };

    const cartResponse = await request(app)
      .post("/api/cart/items")
      .set(authorization)
      .send({ productId: 1, quantity: 2 });
    expect(cartResponse.status).toBe(201);

    const checkoutResponse = await request(app)
      .post("/api/orders")
      .set(authorization)
      .send({});

    expect(checkoutResponse.status).toBe(201);
    expect(checkoutResponse.body).toMatchObject({
      success: true,
      message: "Order created successfully",
      data: {
        order: {
          total: 19.98,
          status: "paid",
          items: [
            {
              productId: 1,
              title: "Essence Mascara Lash Princess",
              price: 9.99,
              quantity: 2,
            },
          ],
        },
      },
    });

    const orderId = checkoutResponse.body.data.order.id as string;
    const [persistedOrder, persistedCart] = await Promise.all([
      Order.findById(orderId),
      Cart.findOne({}),
    ]);
    expect(persistedOrder?.items[0]?.price).toBe(9.99);
    expect(persistedCart?.items).toHaveLength(0);

    const cartAfterCheckout = await request(app)
      .get("/api/cart")
      .set(authorization);
    expect(cartAfterCheckout.body.data.cart.totalItems).toBe(0);

    const listResponse = await request(app)
      .get("/api/orders?page=1&limit=10")
      .set(authorization);
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toMatchObject({
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
    expect(listResponse.body.data.orders).toHaveLength(1);

    const detailResponse = await request(app)
      .get(`/api/orders/${orderId}`)
      .set(authorization);
    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.data.order.id).toBe(orderId);
  });

  it("rejects empty checkout and another user's order access", async () => {
    const ownerToken = await registerAndLogin("owner@example.com");
    const ownerAuthorization = { Authorization: `Bearer ${ownerToken}` };

    const emptyResponse = await request(app)
      .post("/api/orders")
      .set(ownerAuthorization)
      .send({});
    expect(emptyResponse.status).toBe(400);
    expect(emptyResponse.body.message).toBe("Cannot checkout an empty cart");

    await request(app)
      .post("/api/cart/items")
      .set(ownerAuthorization)
      .send({ productId: 1, quantity: 1 });
    const checkoutResponse = await request(app)
      .post("/api/orders")
      .set(ownerAuthorization)
      .send({});
    const orderId = checkoutResponse.body.data.order.id as string;

    const otherToken = await registerAndLogin("other@example.com");
    const forbiddenDetail = await request(app)
      .get(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(forbiddenDetail.status).toBe(404);
    expect(forbiddenDetail.body.message).toBe("Order not found");
  });

  it("validates order identifiers and pagination", async () => {
    const token = await registerAndLogin("validation@example.com");
    const authorization = { Authorization: `Bearer ${token}` };

    const invalidId = await request(app)
      .get("/api/orders/not-an-id")
      .set(authorization);
    expect(invalidId.status).toBe(400);

    const invalidPagination = await request(app)
      .get("/api/orders?page=0&limit=101")
      .set(authorization);
    expect(invalidPagination.status).toBe(400);
  });
});
