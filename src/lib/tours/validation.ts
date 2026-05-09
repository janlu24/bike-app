const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const MAX_NAME = 100;
const MAX_LOCATION = 200;
const MAX_DISTANCE = 99_999.99;
const MAX_ELEVATION = 99_999;
const MAX_DURATION_HOURS = 999;

export type TourStatus = "planned" | "completed";

export interface TourInput {
  name: string;
  date: string | null;
  start_location: string | null;
  destination: string | null;
  status: TourStatus;
  planned_distance_km: number | null;
  planned_elevation_up_m: number | null;
  planned_elevation_down_m: number | null;
  actual_distance_km: number | null;
  actual_elevation_up_m: number | null;
  actual_elevation_down_m: number | null;
  duration_hours: number | null;
  duration_minutes: number | null;
  is_public: boolean;
}

export type TourFieldError =
  | "name"
  | "date"
  | "start_location"
  | "destination"
  | "status"
  | "planned_distance_km"
  | "planned_elevation_up_m"
  | "planned_elevation_down_m"
  | "actual_distance_km"
  | "actual_elevation_up_m"
  | "actual_elevation_down_m"
  | "duration_hours"
  | "duration_minutes";

export interface TourValidationResult {
  data: TourInput | null;
  fieldErrors: Partial<Record<TourFieldError, string>>;
}

function sanitize(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseOptionalNonnegFloat(
  raw: string,
  max: number
): { value: number | null; error?: string } {
  if (raw === "") return { value: null };
  const n = parseFloat(raw);
  if (isNaN(n) || n < 0) return { value: null, error: "Muss eine Zahl ≥ 0 sein." };
  if (n > max) return { value: null, error: `Maximalwert: ${max}.` };
  return { value: n };
}

function parseOptionalNonnegInt(
  raw: string,
  max: number
): { value: number | null; error?: string } {
  if (raw === "") return { value: null };
  const n = parseInt(raw, 10);
  if (isNaN(n) || n < 0 || !Number.isInteger(n))
    return { value: null, error: "Muss eine ganze Zahl ≥ 0 sein." };
  if (n > max) return { value: null, error: `Maximalwert: ${max}.` };
  return { value: n };
}

export function parseTourInput(formData: FormData): TourValidationResult {
  const fieldErrors: TourValidationResult["fieldErrors"] = {};

  const name = sanitize(formData.get("name"));
  const rawDate = sanitize(formData.get("date"));
  const startLocation = sanitize(formData.get("start_location")) || null;
  const destination = sanitize(formData.get("destination")) || null;
  const rawStatus = sanitize(formData.get("status"));
  const isPublic = formData.get("is_public") === "on";

  // name
  if (name.length === 0) {
    fieldErrors.name = "Name ist ein Pflichtfeld.";
  } else if (name.length > MAX_NAME) {
    fieldErrors.name = `Höchstens ${MAX_NAME} Zeichen.`;
  }

  // date
  let date: string | null = null;
  if (rawDate !== "") {
    if (!DATE_RE.test(rawDate)) {
      fieldErrors.date = "Ungültiges Datum (YYYY-MM-DD).";
    } else {
      date = rawDate;
    }
  }

  // locations
  if (startLocation && startLocation.length > MAX_LOCATION) {
    fieldErrors.start_location = `Höchstens ${MAX_LOCATION} Zeichen.`;
  }
  if (destination && destination.length > MAX_LOCATION) {
    fieldErrors.destination = `Höchstens ${MAX_LOCATION} Zeichen.`;
  }

  // status
  let status: TourStatus = "planned";
  if (rawStatus === "planned" || rawStatus === "completed") {
    status = rawStatus;
  } else if (rawStatus !== "") {
    fieldErrors.status = "Ungültiger Status.";
  }

  // numeric fields
  const plannedDist = parseOptionalNonnegFloat(sanitize(formData.get("planned_distance_km")), MAX_DISTANCE);
  if (plannedDist.error) fieldErrors.planned_distance_km = plannedDist.error;

  const plannedUp = parseOptionalNonnegInt(sanitize(formData.get("planned_elevation_up_m")), MAX_ELEVATION);
  if (plannedUp.error) fieldErrors.planned_elevation_up_m = plannedUp.error;

  const plannedDown = parseOptionalNonnegInt(sanitize(formData.get("planned_elevation_down_m")), MAX_ELEVATION);
  if (plannedDown.error) fieldErrors.planned_elevation_down_m = plannedDown.error;

  const actualDist = parseOptionalNonnegFloat(sanitize(formData.get("actual_distance_km")), MAX_DISTANCE);
  if (actualDist.error) fieldErrors.actual_distance_km = actualDist.error;

  const actualUp = parseOptionalNonnegInt(sanitize(formData.get("actual_elevation_up_m")), MAX_ELEVATION);
  if (actualUp.error) fieldErrors.actual_elevation_up_m = actualUp.error;

  const actualDown = parseOptionalNonnegInt(sanitize(formData.get("actual_elevation_down_m")), MAX_ELEVATION);
  if (actualDown.error) fieldErrors.actual_elevation_down_m = actualDown.error;

  const durationHours = parseOptionalNonnegInt(sanitize(formData.get("duration_hours")), MAX_DURATION_HOURS);
  if (durationHours.error) fieldErrors.duration_hours = durationHours.error;

  const durationMinutes = parseOptionalNonnegInt(sanitize(formData.get("duration_minutes")), 59);
  if (durationMinutes.error) fieldErrors.duration_minutes = durationMinutes.error;

  if (Object.keys(fieldErrors).length > 0) {
    return { data: null, fieldErrors };
  }

  return {
    data: {
      name,
      date,
      start_location: startLocation,
      destination,
      status,
      planned_distance_km: plannedDist.value,
      planned_elevation_up_m: plannedUp.value,
      planned_elevation_down_m: plannedDown.value,
      actual_distance_km: actualDist.value,
      actual_elevation_up_m: actualUp.value,
      actual_elevation_down_m: actualDown.value,
      duration_hours: durationHours.value,
      duration_minutes: durationMinutes.value,
      is_public: isPublic,
    },
    fieldErrors: {},
  };
}

export function isValidTourId(value: string): boolean {
  return UUID_RE.test(value);
}
