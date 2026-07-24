import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app.js";
import { Product } from "../models/Product.js";

const app = createApp();
let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await Product.createIndexes();
});

beforeEach(async () => {
  vi.restoreAllMocks();
  await Product.deleteMany({});
  
  await Product.insertMany([
    { id: 1, title: "Apple Phone 13", brand: "Apple", category: "smartphones", tags: ["mobile", "ios"], description: "Apple smartphone", price: 800, rating: 4.8, thumbnail: "https://example.com/1.png" },
    { id: 2, title: "Galaxy Phone", brand: "Samsung", category: "smartphones", tags: ["mobile", "android"], description: "Android smartphone", price: 600, rating: 4.7, thumbnail: "https://example.com/2.png" },
    { id: 3, title: "Wooden Desk", brand: "FurniCo", category: "furniture", tags: ["home", "office"], description: "Desk for a home office", price: 200, rating: 4.5, thumbnail: "https://example.com/3.png" },
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Product catalog search", () => {
  it.each([
    ["apple", 1],
    ["android", 2],
    ["furniture", 3],
    ["home office", 3],
    ["modern desk", 3],
  ])("searches all catalog fields for: %s", async (query, expectedId) => {
    const response = await request(app).get(`/api/products/search?q=${encodeURIComponent(query)}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([
      expect.objectContaining({ id: expectedId }),
    ]);
  });

  it("returns ranked, paginated matches and a stable response shape", async () => {
    // There are 2 'phone' products (iPhone and Galaxy Phone)
    const response = await request(app).get("/api/products/search?q=phone&page=2&limit=1");

    expect(response.status).toBe(200);
    expect(response.body.pagination).toMatchObject({ total: 2, page: 2, limit: 1, totalPages: 2 });
    expect(response.body.data).toHaveLength(1);
  });
});
