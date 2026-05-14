export type WeightUnit = "g" | "kg";

const KG_THRESHOLD = 1000;

export function formatWeight(grams: number | null | undefined): string {
  if (grams === null || grams === undefined || !Number.isFinite(grams)) {
    return "–";
  }
  const rounded = Math.round(grams);
  if (rounded < KG_THRESHOLD) {
    return `${rounded.toLocaleString("de-DE")} g`;
  }
  return `${(rounded / 1000).toFixed(3).replace(".", ",").replace(/,?0+$/, "")} kg`;
}

/** Always renders in kg with exactly 3 decimal places and German comma, e.g. "11,450 kg". */
export function formatWeight3dp(grams: number | null | undefined): string {
  if (grams === null || grams === undefined || !Number.isFinite(grams)) {
    return "–";
  }
  return `${(Math.round(grams) / 1000).toFixed(3).replace(".", ",")} kg`;
}

export function parseToGrams(
  value: string | number | null | undefined,
  unit: WeightUnit
): number | null {
  if (value === null || value === undefined) return null;
  const raw = typeof value === "number" ? String(value) : value.trim();
  if (raw === "") return null;
  const parsed = Number(raw.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(unit === "kg" ? parsed * 1000 : parsed);
}

export function gramsToInputValue(grams: number | null, unit: WeightUnit): string {
  if (grams === null || !Number.isFinite(grams)) return "";
  if (unit === "g") return String(Math.round(grams));
  return (grams / 1000).toFixed(3).replace(/\.?0+$/, "").replace(".", ",");
}
