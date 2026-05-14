import { describe, it, expect } from "vitest";
import { formatWeight, formatWeight3dp, parseToGrams, gramsToInputValue } from "./weight";

describe("formatWeight", () => {
  it("returns '–' for null", () => expect(formatWeight(null)).toBe("–"));
  it("returns '–' for undefined", () => expect(formatWeight(undefined)).toBe("–"));
  it("formats 0 g", () => expect(formatWeight(0)).toBe("0 g"));
  it("formats 450 g", () => expect(formatWeight(450)).toBe("450 g"));
  it("formats 999 g stays in grams", () => expect(formatWeight(999)).toBe("999 g"));
  it("formats 1000 g as 1 kg", () => expect(formatWeight(1000)).toBe("1 kg"));
  it("formats 7500 g as 7,5 kg", () => expect(formatWeight(7500)).toBe("7,5 kg"));
  it("formats 7452 g as 7,452 kg", () => expect(formatWeight(7452)).toBe("7,452 kg"));
  it("formats 8000 g as 8 kg (no trailing decimals)", () => expect(formatWeight(8000)).toBe("8 kg"));
});

describe("formatWeight3dp", () => {
  it("returns '–' for null", () => expect(formatWeight3dp(null)).toBe("–"));
  it("returns '–' for undefined", () => expect(formatWeight3dp(undefined)).toBe("–"));
  it("formats 0 g as 0,000 kg", () => expect(formatWeight3dp(0)).toBe("0,000 kg"));
  it("formats 1000 g as 1,000 kg", () => expect(formatWeight3dp(1000)).toBe("1,000 kg"));
  it("formats 7500 g as 7,500 kg (no trailing zero stripping)", () => expect(formatWeight3dp(7500)).toBe("7,500 kg"));
  it("formats 7452 g as 7,452 kg", () => expect(formatWeight3dp(7452)).toBe("7,452 kg"));
  it("formats 11450 g as 11,450 kg", () => expect(formatWeight3dp(11450)).toBe("11,450 kg"));
  it("formats 17770 g as 17,770 kg", () => expect(formatWeight3dp(17770)).toBe("17,770 kg"));
  it("formats 500 g as 0,500 kg (sub-threshold still uses kg)", () => expect(formatWeight3dp(500)).toBe("0,500 kg"));
  it("rounds before formatting: 7452.6 → 7453 g → 7,453 kg", () => expect(formatWeight3dp(7452.6)).toBe("7,453 kg"));
});

describe("parseToGrams — unit g", () => {
  it("parses '450' → 450", () => expect(parseToGrams("450", "g")).toBe(450));
  it("parses '0' → 0", () => expect(parseToGrams("0", "g")).toBe(0));
  it("returns null for empty string", () => expect(parseToGrams("", "g")).toBeNull());
  it("returns null for null", () => expect(parseToGrams(null, "g")).toBeNull());
  it("returns null for negative", () => expect(parseToGrams("-10", "g")).toBeNull());
  it("returns null for non-numeric", () => expect(parseToGrams("abc", "g")).toBeNull());
  it("rounds 450.7 → 451", () => expect(parseToGrams("450.7", "g")).toBe(451));
});

describe("parseToGrams — unit kg", () => {
  it("parses '7.5' kg → 7500", () => expect(parseToGrams("7.5", "kg")).toBe(7500));
  it("parses '7,5' kg (German comma) → 7500", () => expect(parseToGrams("7,5", "kg")).toBe(7500));
  it("parses '1' kg → 1000", () => expect(parseToGrams("1", "kg")).toBe(1000));
  it("returns null for empty string", () => expect(parseToGrams("", "kg")).toBeNull());
  it("returns null for negative", () => expect(parseToGrams("-1", "kg")).toBeNull());
  it("rounds 7.4521 kg → 7452", () => expect(parseToGrams("7.4521", "kg")).toBe(7452));
});

describe("gramsToInputValue", () => {
  it("returns '' for null", () => expect(gramsToInputValue(null, "g")).toBe(""));
  it("returns '450' for 450g in g mode", () => expect(gramsToInputValue(450, "g")).toBe("450"));
  it("returns '1000' for 1000g in g mode", () => expect(gramsToInputValue(1000, "g")).toBe("1000"));
  it("returns '7,5' for 7500g in kg mode", () => expect(gramsToInputValue(7500, "kg")).toBe("7,5"));
  it("returns '1' for 1000g in kg mode", () => expect(gramsToInputValue(1000, "kg")).toBe("1"));
  it("returns '7,452' for 7452g in kg mode", () => expect(gramsToInputValue(7452, "kg")).toBe("7,452"));
});
