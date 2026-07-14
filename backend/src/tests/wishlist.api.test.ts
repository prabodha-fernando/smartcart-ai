import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app.js";
import { User } from "../models/User.js";
import { Wishlist } from "../models/Wishlist.js";
import { dummyjson } from "../services/product.service.js";

const app = createApp();
let mongoServer: MongoMemoryServer;

async function registerAndGetToken() {
  const response = await request(app).post("/api/auth/register").send({
    name: "Wishlist Tester",
    email: "wishlist@example.com",
    password: "secure-password-123",
  });

  expect(response.status).toBe(201);
  return response.body.data.accessToken as string;
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

beforeEach(async () => {
  await Promise.all([User.deleteMany({}), Wishlist.deleteMany({})]);
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

describe("Wishlist API", () => {
  it("rejects requests without a JWT", async () => {
    const response = await request(app).get("/api/wishlist");

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      message: "Missing or malformed Authorization header",
    });
  });

  it("rejects invalid add-item payloads", async () => {
    const token = await registerAndGetToken();
    const response = await request(app)
      .post("/api/wishlist/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: 0 });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      message: "Validation failed",
    });
  });

  it("adds, persists, reads, prevents duplicates, and removes a product", async () => {
    const token = await registerAndGetToken();
    const authorization = { Authorization: `Bearer ${token}` };

    const addResponse = await request(app)
      .post("/api/wishlist/items")
      .set(authorization)
      .send({ productId: 1 });

    expect(addResponse.status).toBe(201);
    expect(addResponse.body).toMatchObject({
      success: true,
      message: "Product added to wishlist",
      data: {
        wishlist: {
          totalItems: 1,
          items: [
            {
              productId: 1,
              title: "Essence Mascara Lash Princess",
              price: 9.99,
              thumbnail: "https://example.com/product-1.png",
            },
          ],
        },
      },
    });
    expect(dummyjson.get).toHaveBeenCalledWith("/products/1");

    const persistedWishlist = await Wishlist.findOne({});
    expect(persistedWishlist?.items).toHaveLength(1);
    expect(persistedWishlist?.items[0]?.productId).toBe(1);

    const getResponse = await request(app)
      .get("/api/wishlist")
      .set(authorization);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data.wishlist.totalItems).toBe(1);

    const duplicateResponse = await request(app)
      .post("/api/wishlist/items")
      .set(authorization)
      .send({ productId: 1 });

    expect(duplicateResponse.status).toBe(409);
    expect(duplicateResponse.body).toEqual({
      success: false,
      message: "Product already exists in wishlist",
    });

    const deleteResponse = await request(app)
      .delete("/api/wishlist/items/1")
      .set(authorization);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body).toMatchObject({
      success: true,
      message: "Product removed from wishlist",
      data: { wishlist: { items: [], totalItems: 0 } },
    });

    const emptyWishlist = await Wishlist.findOne({});
    expect(emptyWishlist?.items).toHaveLength(0);
  });
});
