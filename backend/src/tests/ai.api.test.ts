import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app.js";
import { AiRateLimit } from "../models/AiRateLimit.js";
import { dummyjson } from "../services/product.service.js";
import { User } from "../models/User.js";

const app = createApp();
let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

beforeEach(async () => {
  await AiRateLimit.deleteMany({});
  await User.deleteMany({});
  vi.restoreAllMocks();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("AI API", () => {
  it("handles greetings without calling the catalog", async () => {
    const catalog = vi.spyOn(dummyjson, "get");
    const response = await request(app).post("/api/ai/chat").send({
      messages: [{ role: "user", content: "Hello" }],
      lastProducts: [],
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ intent: "greeting", products: [] });
    expect(catalog).not.toHaveBeenCalled();
  });

  it("searches real catalog data and applies price filters", async () => {
    vi.spyOn(dummyjson, "get").mockResolvedValue({
      data: {
        products: [
          { id: 1, title: "Budget Phone", price: 300, rating: 4.3, thumbnail: "https://example.com/1.png" },
          { id: 2, title: "Premium Phone", price: 900, rating: 4.9, thumbnail: "https://example.com/2.png" },
        ],
      },
    });

    const response = await request(app).post("/api/ai/chat").send({
      messages: [{ role: "user", content: "show me one phone under 500" }],
      lastProducts: [],
    });

    expect(response.status).toBe(200);
    expect(response.body.products).toEqual([
      expect.objectContaining({ id: 1, title: "Budget Phone" }),
    ]);
  });

  it.each([
    ["A thoughtful gift for a gamer", "laptops"],
    ["Something elegant to wear to a wedding", "womens-dresses"],
    ["Best noise-cancelling headphones under $200", "mobile-accessories"],
  ])("routes broad need %s to relevant catalog categories", async (prompt, expectedCategory) => {
    const catalog = vi.spyOn(dummyjson, "get").mockImplementation(async (url) => ({
      data: {
        products: String(url).endsWith(`/${expectedCategory}`)
          ? [{ id: 10, title: "Relevant Product", category: expectedCategory, price: 100, rating: 4.8, thumbnail: "https://example.com/relevant.png" }]
          : [],
      },
    }));

    const response = await request(app).post("/api/ai/chat").send({
      messages: [{ role: "user", content: prompt }],
      lastProducts: [],
    });

    expect(response.status).toBe(200);
    expect(response.body.products).toHaveLength(1);
    expect(catalog).toHaveBeenCalledWith(
      `/products/category/${expectedCategory}`,
      { params: { limit: 100 } }
    );
  });

  it("validates requests and produces a grounded fallback blurb", async () => {
    const invalid = await request(app).post("/api/ai/chat").send({ messages: [] });
    expect(invalid.status).toBe(400);

    const whyBuy = await request(app).post("/api/ai/why-buy").send({
      product: { title: "Test Product", price: 25, rating: 4.5 },
    });
    expect(whyBuy.status).toBe(200);
    expect(whyBuy.body.text).toContain("Test Product");
    expect(whyBuy.body.text).toContain("4.5/5");
  });

  it("enforces the distributed limit per authenticated user", async () => {
    const registration = await request(app).post("/api/auth/register").send({
      name: "AI Limit Tester",
      email: "ai-limit@example.com",
      password: "secure-password-123",
    });
    const token = registration.body.data.accessToken as string;
    const payload = { messages: [{ role: "user", content: "hello" }], lastProducts: [] };

    for (let index = 0; index < 20; index += 1) {
      const response = await request(app)
        .post("/api/ai/chat")
        .set("Authorization", `Bearer ${token}`)
        .send(payload);
      expect(response.status).toBe(200);
    }

    const limited = await request(app)
      .post("/api/ai/chat")
      .set("Authorization", `Bearer ${token}`)
      .send(payload);
    expect(limited.status).toBe(429);
  });
});
