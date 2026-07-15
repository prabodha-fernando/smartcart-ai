import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { User } from "../models/User.js";

const app = createApp();
let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

beforeEach(async () => {
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Auth API", () => {
  it("registers with a hashed password, logs in, refreshes, and returns the user", async () => {
    const credentials = {
      email: "auth@example.com",
      password: "secure-password-123",
    };
    const registerResponse = await request(app).post("/api/auth/register").send({
      name: "Auth Tester",
      ...credentials,
    });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.data).toMatchObject({
      user: { name: "Auth Tester", email: credentials.email },
    });
    expect(registerResponse.body.data.accessToken).toEqual(expect.any(String));
    expect(registerResponse.body.data.refreshToken).toEqual(expect.any(String));

    const storedUser = await User.findOne({ email: credentials.email }).select(
      "+password"
    );
    expect(storedUser?.password).not.toBe(credentials.password);
    expect(await storedUser?.comparePassword(credentials.password)).toBe(true);

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send(credentials);
    expect(loginResponse.status).toBe(200);

    const { accessToken, refreshToken } = loginResponse.body.data as {
      accessToken: string;
      refreshToken: string;
    };
    const meResponse = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(meResponse.status).toBe(200);
    expect(meResponse.body.data.user.email).toBe(credentials.email);

    const refreshResponse = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken });
    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body.data.accessToken).toEqual(expect.any(String));
    expect(refreshResponse.body.data.refreshToken).toEqual(expect.any(String));

    const replayResponse = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken });
    expect(replayResponse.status).toBe(401);
  });

  it("rejects duplicate registration, invalid credentials, and missing auth", async () => {
    const account = {
      name: "Auth Tester",
      email: "duplicate@example.com",
      password: "secure-password-123",
    };
    await request(app).post("/api/auth/register").send(account);

    const duplicateResponse = await request(app)
      .post("/api/auth/register")
      .send(account);
    expect(duplicateResponse.status).toBe(409);

    const invalidLogin = await request(app).post("/api/auth/login").send({
      email: account.email,
      password: "wrong-password",
    });
    expect(invalidLogin.status).toBe(401);

    const missingAuth = await request(app).get("/api/auth/me");
    expect(missingAuth.status).toBe(401);
  });

  it("returns meaningful validation errors", async () => {
    const response = await request(app).post("/api/auth/register").send({
      name: "A",
      email: "invalid-email",
      password: "123",
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      message: "Validation failed",
    });
    expect(response.body.details).toBeDefined();
  });
});
