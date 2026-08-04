import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app.js";
import { dummyjson } from "../services/product.service.js";

const app = createApp();
let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(dummyjson, "get").mockResolvedValue({
    data: {
      products: [
        { id: 1, title: "iPhone 13", brand: "Apple", category: "smartphones", tags: ["mobile", "ios"], description: "Apple smartphone", price: 800, rating: 4.8, thumbnail: "https://example.com/1.png" },
        { id: 2, title: "Galaxy Phone", brand: "Samsung", category: "smartphones", tags: ["mobile", "android"], description: "Android smartphone", price: 600, rating: 4.7, thumbnail: "https://example.com/2.png" },
        { id: 3, title: "Wooden Desk", brand: "FurniCo", category: "furniture", tags: ["home", "office"], description: "Desk for a home office", price: 200, rating: 4.5, thumbnail: "https://example.com/3.png" },
      ],
    },
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Product catalog search", () => {
  it.each([
    ["apple phone", 1],
    ["android", 2],
    ["furniture", 3],
    ["home office", 3],
    ["modern desk", 3],
  ])("searches all catalog fields for: %s", async (query, expectedId) => {
    const response = await request(app).get(`/api/products/search?q=${encodeURIComponent(query)}`);

    expect(response.status).toBe(200);
    expect(response.body.products).toEqual([
      expect.objectContaining({ id: expectedId }),
    ]);
    expect(dummyjson.get).toHaveBeenCalledWith("/products", { params: { limit: 0 } });
  });

  it("returns ranked, paginated matches and a stable response shape", async () => {
    const response = await request(app).get("/api/products/search?q=phone&skip=1&limit=1");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ total: 2, skip: 1, limit: 1 });
    expect(response.body.products).toHaveLength(1);
  });
});
