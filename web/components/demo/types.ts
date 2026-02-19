export type Status = "idle" | "training" | "trained";
export type GenerateMode = "batch" | "explore";

export const SECTION_LABEL =
  "text-xs font-medium uppercase tracking-wide text-muted-foreground";

/** Unwrap Base UI Slider's `number | readonly number[]` to a single value. */
export const sliderVal = (v: number | readonly number[]): number =>
  Array.isArray(v) ? v[0] : (v as number);
