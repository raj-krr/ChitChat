import { reactMessageSchema, sendMessageSchema } from "../schemas/message.schema";

describe("Message Validation Schemas", () => {
  describe("reactMessageSchema", () => {
    it("should reject missing emoji", () => {
      const result = reactMessageSchema.body({});
      expect(result.error).toBeDefined();
    });

    it("should accept valid emoji reaction payload", () => {
      const result = reactMessageSchema.body({ emoji: "❤️" });
      expect(result.error).toBeUndefined();
    });
  });

  describe("sendMessageSchema", () => {
    it("should reject missing receiver ID parameter", () => {
      const result = sendMessageSchema.params({});
      expect(result.error).toBeDefined();
    });

    it("should accept valid receiver ID parameter", () => {
      const result = sendMessageSchema.params({ id: "60d5ec49f1b2c82688f8d9b1" });
      expect(result.error).toBeUndefined();
    });
  });
});
