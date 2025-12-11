import { describe, expect, it } from "vitest";

describe("Environment Variables", () => {
  it("should have APP_URL configured", () => {
    expect(process.env.APP_URL).toBeDefined();
    expect(process.env.APP_URL).toContain("http");
  });

  it("should have ADMIN_API_KEY configured", () => {
    expect(process.env.ADMIN_API_KEY).toBeDefined();
    expect(process.env.ADMIN_API_KEY).toContain("2025");
  });
});
