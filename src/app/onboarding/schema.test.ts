import { describe, it, expect } from "vitest";
import { createProfileSchema } from "./schema";

describe("createProfileSchema — username", () => {
  const valid = (u: string) =>
    createProfileSchema.safeParse({ username: u }).success;

  it("accepts 3-char alphanumeric", () => expect(valid("abc")).toBe(true));
  it("accepts max 32 chars", () => expect(valid("a".repeat(32))).toBe(true));
  it("accepts dash and underscore in middle", () =>
    expect(valid("my-user_name")).toBe(true));
  it("rejects single char (below min 3)", () => expect(valid("x")).toBe(false));

  it("rejects 2 chars", () => expect(valid("ab")).toBe(false));
  it("rejects 33 chars", () => expect(valid("a".repeat(33))).toBe(false));
  it("rejects leading dash", () => expect(valid("-username")).toBe(false));
  it("rejects trailing underscore", () =>
    expect(valid("username_")).toBe(false));
  it("rejects spaces", () => expect(valid("my user")).toBe(false));
  it("rejects special chars", () => expect(valid("user@name")).toBe(false));
});

describe("createProfileSchema — full_name", () => {
  it("accepts undefined (optional)", () =>
    expect(
      createProfileSchema.safeParse({ username: "user" }).success
    ).toBe(true));
  it("accepts empty string", () =>
    expect(
      createProfileSchema.safeParse({ username: "user", full_name: "" }).success
    ).toBe(true));
  it("accepts max 80 chars", () =>
    expect(
      createProfileSchema.safeParse({ username: "user", full_name: "a".repeat(80) }).success
    ).toBe(true));
  it("rejects 81 chars", () =>
    expect(
      createProfileSchema.safeParse({ username: "user", full_name: "a".repeat(81) }).success
    ).toBe(false));
});

describe("createProfileSchema — is_public", () => {
  it("defaults to false when omitted", () => {
    const result = createProfileSchema.safeParse({ username: "user" });
    expect(result.success && result.data.is_public).toBe(false);
  });
  it("accepts true", () => {
    const result = createProfileSchema.safeParse({ username: "user", is_public: true });
    expect(result.success && result.data.is_public).toBe(true);
  });
});
