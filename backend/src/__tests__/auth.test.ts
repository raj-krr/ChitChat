import { registerSchema, loginSchema, verifyEmailSchema } from "../schemas/auth.schema";

describe("Auth Input Validation Schemas", () => {
  describe("registerSchema", () => {
    it("should reject missing email", () => {
      const result = registerSchema.body({ username: "testuser", password: "password123" });
      expect(result.error).toBeDefined();
    });

    it("should reject short username", () => {
      const result = registerSchema.body({ email: "test@example.com", username: "ab", password: "password123" });
      expect(result.error).toBeDefined();
    });

    it("should accept valid payload", () => {
      const result = registerSchema.body({ email: "test@example.com", username: "validuser", password: "password123" });
      expect(result.error).toBeUndefined();
    });
  });

  describe("loginSchema", () => {
    it("should reject missing identifier", () => {
      const result = loginSchema.body({ password: "password123" });
      expect(result.error).toBeDefined();
    });

    it("should accept valid login payload", () => {
      const result = loginSchema.body({ identifier: "validuser", password: "password123" });
      expect(result.error).toBeUndefined();
    });
  });

  describe("verifyEmailSchema", () => {
    it("should reject invalid verification code length", () => {
      const result = verifyEmailSchema.body({ email: "test@example.com", verificationCode: "123" });
      expect(result.error).toBeDefined();
    });

    it("should accept valid 6-digit verification code", () => {
      const result = verifyEmailSchema.body({ email: "test@example.com", verificationCode: "123456" });
      expect(result.error).toBeUndefined();
    });
  });
});
