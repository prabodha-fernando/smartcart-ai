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
  vi.spyOn(globalThis, "fetch").mockRejectedValue(
    new Error("AI provider disabled in deterministic API tests")
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("AI API", () => {
  const storeCategories = [
    "beauty", "fragrances", "furniture", "groceries", "home-decoration",
    "kitchen-accessories", "laptops", "mens-shirts", "mens-shoes",
    "mens-watches", "mobile-accessories", "motorcycle", "skin-care",
    "smartphones", "sports-accessories", "sunglasses", "tablets", "tops",
    "vehicle", "womens-bags", "womens-dresses", "womens-jewellery",
    "womens-shoes", "womens-watches",
  ];
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

  it.each([
    ["Thank you", "gratitude"],
    ["Tell me today's weather", "out_of_scope"],
  ])("handles non-search intent %s without catalog access", async (content, intent) => {
    const catalog = vi.spyOn(dummyjson, "get");
    const response = await request(app).post("/api/ai/chat").send({
      messages: [{ role: "user", content }],
      lastProducts: [],
    });
    expect(response.status).toBe(200);
    expect(response.body.intent).toBe(intent);
    expect(response.body.products).toEqual([]);
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
    expect(response.body.reply).toContain("Budget Phone");
    expect(response.body.reply).toContain("$300.00");
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
    expect(response.body.reply).toContain("Relevant Product");
    expect(catalog).toHaveBeenCalledWith(
      `/products/category/${expectedCategory}`,
      { params: { limit: 100 } }
    );
  });

  it("carries the previous product request into a budget follow-up", async () => {
    const catalog = vi.spyOn(dummyjson, "get").mockResolvedValue({
      data: {
        products: [
          { id: 1, title: "Affordable Laptop", category: "laptops", price: 700, rating: 4.2, thumbnail: "https://example.com/1.png" },
          { id: 2, title: "Expensive Laptop", category: "laptops", price: 1400, rating: 4.8, thumbnail: "https://example.com/2.png" },
        ],
      },
    });
    const response = await request(app).post("/api/ai/chat").send({
      messages: [
        { role: "user", content: "Show me laptops" },
        { role: "assistant", content: "Here are some laptops." },
        { role: "user", content: "under $1000" },
      ],
      lastProducts: [],
    });
    expect(response.status).toBe(200);
    expect(response.body.products).toEqual([
      expect.objectContaining({ id: 1, title: "Affordable Laptop" }),
    ]);
    expect(catalog).toHaveBeenCalledWith("/products/category/laptops", { params: { limit: 100 } });
  });

  it("returns only the customer's requested brand, budget, rating, sort, and count", async () => {
    vi.spyOn(dummyjson, "get").mockResolvedValue({
      data: {
        products: [
          { id: 1, title: "Samsung Value Phone", brand: "Samsung", category: "smartphones", price: 500, rating: 4.4, thumbnail: "https://example.com/1.png" },
          { id: 2, title: "Samsung Premium Phone", brand: "Samsung", category: "smartphones", price: 750, rating: 4.8, thumbnail: "https://example.com/2.png" },
          { id: 3, title: "Apple Phone", brand: "Apple", category: "smartphones", price: 450, rating: 4.9, thumbnail: "https://example.com/3.png" },
          { id: 4, title: "Samsung Low Rated", brand: "Samsung", category: "smartphones", price: 300, rating: 3.2, thumbnail: "https://example.com/4.png" },
        ],
      },
    });

    const response = await request(app).post("/api/ai/chat").send({
      messages: [{ role: "user", content: "Show me one cheapest Samsung phone under $800 with at least 4 stars" }],
      lastProducts: [],
    });

    expect(response.status).toBe(200);
    expect(response.body.products).toEqual([
      expect.objectContaining({ id: 1, title: "Samsung Value Phone", price: 500 }),
    ]);
  });

  it("lets AI choose only from categories currently available in the store", async () => {
    vi.spyOn(dummyjson, "get").mockImplementation(async (url) => {
      if (url === "/products/categories") {
        return { data: [{ slug: "sports-accessories" }, { slug: "groceries" }] };
      }
      return {
        data: {
          products: [{ id: 20, title: "Cricket Bat", category: "sports-accessories", price: 80, rating: 4.7, thumbnail: "https://example.com/bat.png" }],
        },
      };
    });
    vi.mocked(globalThis.fetch).mockImplementation(async (_url, options) => {
      const body = JSON.parse(String(options?.body)) as { messages?: Array<{ content?: string }> };
      const prompt = body.messages?.[0]?.content ?? "";
      const content = prompt.includes("Understand exactly")
        ? JSON.stringify({ intent: "product_search", requiresProducts: true, reply: "", search: { categories: ["sports-accessories"], limit: 4 } })
        : "I found a cricket product from the current store catalog.";
      return { ok: true, json: async () => ({ choices: [{ message: { content } }] }) } as Response;
    });

    const response = await request(app).post("/api/ai/chat").send({
      messages: [{ role: "user", content: "I need equipment for cricket" }],
      lastProducts: [],
    });

    expect(response.status).toBe(200);
    expect(response.body.products).toEqual([
      expect.objectContaining({ id: 20, title: "Cricket Bat" }),
    ]);
    expect(dummyjson.get).toHaveBeenCalledWith(
      "/products/category/sports-accessories",
      { params: { limit: 100 } }
    );
  });

  it("does not let AI misclassify an explicit catalog search", async () => {
    vi.spyOn(dummyjson, "get").mockImplementation(async (url) => {
      if (url === "/products/categories") {
        return { data: storeCategories.map((slug) => ({ slug })) };
      }
      return {
        data: {
          products: [{ id: 21, title: "Reliable Phone", category: "smartphones", price: 300, rating: 4.6, thumbnail: "https://example.com/phone.png" }],
        },
      };
    });
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              intent: "app_question",
              requiresProducts: false,
              reply: "Incorrect classification",
              search: { categories: [] },
            }),
          },
        }],
      }),
    } as Response);

    const response = await request(app).post("/api/ai/chat").send({
      messages: [{ role: "user", content: "Show me a phone under $500" }],
      lastProducts: [],
    });

    expect(response.status).toBe(200);
    expect(response.body.intent).toBe("product_search");
    expect(response.body.products).toEqual([
      expect.objectContaining({ id: 21, title: "Reliable Phone" }),
    ]);
  });

  it("rejects an AI reply that names a product outside the selected catalog results", async () => {
    vi.spyOn(dummyjson, "get").mockImplementation(async (url) => {
      if (url === "/products/categories") {
        return { data: storeCategories.map((slug) => ({ slug })) };
      }
      return {
        data: {
          products: [{ id: 22, title: "Samsung Galaxy S8", brand: "Samsung", category: "smartphones", price: 499.99, rating: 4.4, thumbnail: "https://example.com/s8.png" }],
        },
      };
    });
    vi.mocked(globalThis.fetch).mockImplementation(async (_url, options) => {
      const body = JSON.parse(String(options?.body)) as { response_format?: unknown };
      const content = body.response_format
        ? JSON.stringify({ intent: "product_search", requiresProducts: true, search: { categories: ["smartphones"] } })
        : "The Samsung Galaxy A13 is the perfect choice for you.";
      return {
        ok: true,
        json: async () => ({ choices: [{ message: { content } }] }),
      } as Response;
    });

    const response = await request(app).post("/api/ai/chat").send({
      messages: [{ role: "user", content: "Show me a Samsung phone" }],
      lastProducts: [],
    });

    expect(response.status).toBe(200);
    expect(response.body.products[0].title).toBe("Samsung Galaxy S8");
    expect(response.body.reply).toContain("Samsung Galaxy S8");
    expect(response.body.reply).not.toContain("Galaxy A13");
  });

  it.each(storeCategories)("filters the complete store category: %s", async (category) => {
    const catalog = vi.spyOn(dummyjson, "get").mockImplementation(async (url) => {
      if (url === "/products/categories") return { data: storeCategories.map((slug) => ({ slug })) };
      return {
        data: {
          products: [{ id: 30, title: `${category} product`, category, price: 50, rating: 4.2, thumbnail: "https://example.com/category.png" }],
        },
      };
    });

    const response = await request(app).post("/api/ai/chat").send({
      messages: [{ role: "user", content: `Show me ${category}` }],
      lastProducts: [],
    });

    expect(response.status).toBe(200);
    expect(response.body.products).toHaveLength(1);
    expect(catalog).toHaveBeenCalledWith(`/products/category/${category}`, { params: { limit: 100 } });
  });

  it.each([
    ["Show me the top rated phone", 2],
    ["Show me the best-selling phone", 3],
  ])("applies requested ranking only for: %s", async (content, expectedId) => {
    vi.spyOn(dummyjson, "get").mockResolvedValue({
      data: {
        products: [
          { id: 1, title: "Ordinary Phone", category: "smartphones", price: 300, rating: 4.1, reviews: [{}], thumbnail: "https://example.com/1.png" },
          { id: 2, title: "Highest Rated Phone", category: "smartphones", price: 500, rating: 4.95, reviews: [{}, {}], thumbnail: "https://example.com/2.png" },
          { id: 3, title: "Most Reviewed Phone", category: "smartphones", price: 450, rating: 4.6, reviews: [{}, {}, {}, {}, {}], thumbnail: "https://example.com/3.png" },
        ],
      },
    });

    const response = await request(app).post("/api/ai/chat").send({
      messages: [{ role: "user", content }],
      lastProducts: [],
    });

    expect(response.status).toBe(200);
    expect(response.body.products).toHaveLength(1);
    expect(response.body.products[0].id).toBe(expectedId);
  });

  it("respects an explicit result count for a ranked category request", async () => {
    vi.spyOn(dummyjson, "get").mockResolvedValue({
      data: {
        products: [
          { id: 1, title: "Phone A", category: "smartphones", price: 300, rating: 4.2, thumbnail: "https://example.com/1.png" },
          { id: 2, title: "Phone B", category: "smartphones", price: 400, rating: 4.9, thumbnail: "https://example.com/2.png" },
          { id: 3, title: "Phone C", category: "smartphones", price: 350, rating: 4.7, thumbnail: "https://example.com/3.png" },
          { id: 4, title: "Phone D", category: "smartphones", price: 250, rating: 4.5, thumbnail: "https://example.com/4.png" },
        ],
      },
    });

    const response = await request(app).post("/api/ai/chat").send({
      messages: [{ role: "user", content: "Show me top 3 rated phones" }],
      lastProducts: [],
    });

    expect(response.status).toBe(200);
    expect(response.body.products.map((product: { id: number }) => product.id)).toEqual([2, 3, 4]);
  });

  it("strictly applies an explicitly requested color inside the selected category", async () => {
    const catalog = vi.spyOn(dummyjson, "get").mockResolvedValue({
      data: {
        products: [
          { id: 1, title: "Red Evening Dress", category: "womens-dresses", description: "Elegant red dress", price: 80, rating: 4.6, thumbnail: "https://example.com/red.png" },
          { id: 2, title: "Black Evening Dress", category: "womens-dresses", description: "Elegant black dress", price: 70, rating: 4.9, thumbnail: "https://example.com/black.png" },
        ],
      },
    });

    const response = await request(app).post("/api/ai/chat").send({
      messages: [{ role: "user", content: "Show me a red dress" }],
      lastProducts: [],
    });

    expect(response.status).toBe(200);
    expect(response.body.products).toEqual([
      expect.objectContaining({ id: 1, title: "Red Evening Dress" }),
    ]);
    expect(catalog).toHaveBeenCalledWith(
      "/products/category/womens-dresses",
      { params: { limit: 100 } }
    );
  });

  it("validates requests and produces a grounded fallback blurb", async () => {
    const invalid = await request(app).post("/api/ai/chat").send({ messages: [] });
    expect(invalid.status).toBe(400);

    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("NVIDIA unavailable"));
    const product = {
      title: "Test Product",
      brand: "Test Brand",
      category: "laptops",
      description: "A lightweight computer for everyday work.",
      price: 25,
      rating: 4.5,
      discountPercentage: 10,
      shippingInformation: "Ships in 2 days",
      warrantyInformation: "1 year warranty",
      availabilityStatus: "In Stock",
    };
    const whyBuy = await request(app).post("/api/ai/why-buy").send({
      product,
    });
    expect(whyBuy.status).toBe(200);
    expect(whyBuy.body.text).toContain("Test Product");
    expect(whyBuy.body.text).toContain("4.5/5");
    expect(whyBuy.body.text).toContain("A lightweight computer for everyday work.");
    expect(whyBuy.body.text).toContain("10% off");
    expect(whyBuy.body.text).toContain("Ships in 2 days");

    const regenerated = await request(app).post("/api/ai/why-buy").send({
      product,
      variation: 1,
    });
    expect(regenerated.status).toBe(200);
    expect(regenerated.body.text).not.toBe(whyBuy.body.text);
    expect(regenerated.body.text).toContain("Test Product");
    expect(regenerated.body.text).toContain("Ships in 2 days");
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
