const request = require("supertest");
const app = require("./app");

describe("Node.js API tests", () => {
  test("GET / should return 200", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("API is working!");
  });

  test("POST /api/subscribe should accept a valid email", async () => {
    const response = await request(app)
      .post("/api/subscribe")
      .send({ email: "ousa@example.com" });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe("ousa@example.com");
  });

  test("POST /api/subscribe should reject an invalid email", async () => {
    const response = await request(app)
      .post("/api/subscribe")
      .send({ email: "invalid-email" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});