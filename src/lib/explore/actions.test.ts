import { describe, it, expect } from "vitest";
import { mapRawRowToExploreItem, EXPLORE_PAGE_SIZE } from "./actions";

const BASE_ROW = {
  id: "abc-123",
  category: "Part" as const,
  brand: "SRAM",
  model: "GX Eagle",
  image_url: null,
  weight_g: 450,
};

describe("mapRawRowToExploreItem", () => {
  it("maps a row with a single profile object", () => {
    const row = {
      ...BASE_ROW,
      profiles: { username: "rider42", avatar_url: null },
    };
    const result = mapRawRowToExploreItem(row);
    expect(result.owner.username).toBe("rider42");
    expect(result.owner.avatar_url).toBeNull();
  });

  it("maps a row when profiles is an array (PostgREST array shape)", () => {
    const row = {
      ...BASE_ROW,
      profiles: [{ username: "rider42", avatar_url: "https://cdn.example.com/avatar.jpg" }],
    };
    const result = mapRawRowToExploreItem(row);
    expect(result.owner.username).toBe("rider42");
    expect(result.owner.avatar_url).toBe("https://cdn.example.com/avatar.jpg");
  });

  it("falls back to empty string when profiles is null", () => {
    const row = { ...BASE_ROW, profiles: null };
    const result = mapRawRowToExploreItem(row);
    expect(result.owner.username).toBe("");
    expect(result.owner.avatar_url).toBeNull();
  });

  it("preserves all item fields", () => {
    const row = {
      ...BASE_ROW,
      image_url: "https://cdn.example.com/part.jpg",
      profiles: { username: "u", avatar_url: null },
    };
    const result = mapRawRowToExploreItem(row);
    expect(result.id).toBe("abc-123");
    expect(result.category).toBe("Part");
    expect(result.brand).toBe("SRAM");
    expect(result.model).toBe("GX Eagle");
    expect(result.weight_g).toBe(450);
    expect(result.image_url).toBe("https://cdn.example.com/part.jpg");
  });

  it("allows null weight_g and model", () => {
    const row = {
      ...BASE_ROW,
      model: null,
      weight_g: null,
      profiles: { username: "u", avatar_url: null },
    };
    const result = mapRawRowToExploreItem(row);
    expect(result.model).toBeNull();
    expect(result.weight_g).toBeNull();
  });
});

describe("EXPLORE_PAGE_SIZE", () => {
  it("is 24", () => expect(EXPLORE_PAGE_SIZE).toBe(24));
});

describe("pagination offset", () => {
  it("page 0 maps to range 0–23", () => {
    const page = 0;
    const from = page * EXPLORE_PAGE_SIZE;
    const to = from + EXPLORE_PAGE_SIZE - 1;
    expect(from).toBe(0);
    expect(to).toBe(23);
  });

  it("page 1 maps to range 24–47", () => {
    const page = 1;
    const from = page * EXPLORE_PAGE_SIZE;
    const to = from + EXPLORE_PAGE_SIZE - 1;
    expect(from).toBe(24);
    expect(to).toBe(47);
  });

  it("page 2 maps to range 48–71", () => {
    const page = 2;
    const from = page * EXPLORE_PAGE_SIZE;
    const to = from + EXPLORE_PAGE_SIZE - 1;
    expect(from).toBe(48);
    expect(to).toBe(71);
  });
});
