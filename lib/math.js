
/** Clamp value between min and max */
export function clamp(value, min = 0, max = 1) {
  return Math.min(Math.max(min, value), max);
}
