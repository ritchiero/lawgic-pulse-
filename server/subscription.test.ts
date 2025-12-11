import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("subscription router", () => {
  it("should return practice areas", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);
    const areas = await caller.subscription.getPracticeAreas();

    expect(areas).toBeDefined();
    expect(areas.length).toBe(12);
    expect(areas[0]).toHaveProperty("code");
    expect(areas[0]).toHaveProperty("name");
  });

  it("should validate email format", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.subscription.create({
        email: "invalid-email",
        areas: ["fiscal"],
      })
    ).rejects.toThrow();
  });

  it("should require at least one area", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.subscription.create({
        email: "test@example.com",
        areas: [],
      })
    ).rejects.toThrow();
  });
});
