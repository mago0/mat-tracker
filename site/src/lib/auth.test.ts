import { describe, it, expect, vi, beforeEach } from "vitest";
import { validatePassword } from "./auth";

describe("Auth", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  describe("validatePassword", () => {
    it("should return true when password matches ADMIN_PASSWORD", () => {
      vi.stubEnv("ADMIN_PASSWORD", "secret123");

      expect(validatePassword("secret123")).toBe(true);
    });

    it("should return false when password does not match", () => {
      vi.stubEnv("ADMIN_PASSWORD", "secret123");

      expect(validatePassword("wrongpassword")).toBe(false);
    });

    it("should return true when ADMIN_PASSWORD is not set (auth disabled)", () => {
      vi.stubEnv("ADMIN_PASSWORD", "");

      expect(validatePassword("anything")).toBe(true);
    });

    it("should be case-sensitive", () => {
      vi.stubEnv("ADMIN_PASSWORD", "Secret123");

      expect(validatePassword("secret123")).toBe(false);
      expect(validatePassword("SECRET123")).toBe(false);
      expect(validatePassword("Secret123")).toBe(true);
    });
  });
});
