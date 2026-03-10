import { clamp, mapLinear } from "three/src/math/MathUtils.js";

/** Returns a value that repeats on specified duration (in seconds) */
export const sinCycle = (time: number, duration: number = 1, amount: number = 1) => {
  const s = time / 120 * Math.PI * 2; // 1 sec full cycle

  return Math.sin(s / duration) * amount;
}

/**
 * Random utility
 * - (): 0.0 to 1.0
 * - (max): 0.0 to max
 * - (min, max): min to max
 * - (array): random element
 */
export function random(): number;
export function random(max: number): number;
export function random(min: number, max: number): number;
export function random<T>(arr: T[]): T;
export function random(a?: number | any[], b?: number): any {
  // Case: Array
  if (Array.isArray(a)) {
    return a[Math.floor(Math.random() * a.length)];
  }

  // Case: Two numbers (min, max)
  if (typeof a === 'number' && typeof b === 'number') {
    return Math.random() * (b - a) + a;
  }

  // Case: One number (max)
  if (typeof a === 'number') {
    return Math.random() * a;
  }

  // Case: No arguments
  return Math.random();
}

/**
 * Returns a random integer between min and max (inclusive)
 */
export const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Returns true based on a 0 to 1 probability
 * e.g. chance(0.2) returns true 20% of the time.
 */
export const chance = (n: number = 0.5): boolean => Math.random() < n;

/**
 * Maps a value from one range to another and snaps it to an integer.
 * Useful for selecting array indices or discrete UI steps from audio.
 */
export const mapQuantize = (
  value: number,
  inLow: number,
  inHigh: number,
  outLow: number,
  outHigh: number,
  clampOutput: boolean = true,
): number => {
  const result = mapLinear(value, inLow, inHigh, outLow, outHigh);

  if (clampOutput) {
    return Math.floor(clamp(result, outLow, outHigh));
  }

  return Math.floor(result);
};

/**
 * Similar to mapQuantize but returns the value as a float snapped to 
 * a specific interval (e.g., snap to nearest 0.5)
 */
export const mapSnap = (
  value: number,
  inLow: number,
  inHigh: number,
  outLow: number,
  outHigh: number,
  step: number = 1
): number => {
  const result = mapLinear(value, inLow, inHigh, outLow, outHigh);
  return Math.round(result / step) * step;
};

/**
 * Wraps mapLinear between its min and max values
 */
export const mapClamp = (
  value: number,
  inLow: number,
  inHigh: number,
  outLow: number,
  outHigh: number
): number => {
  return clamp(mapLinear(value, inLow, inHigh, outLow, outHigh), outLow, outHigh);
};

/**
 * Creates a cubic-bezier easing function.
 * @param x1 - Control point 1 X (0 to 1)
 * @param y1 - Control point 1 Y (can go beyond 0-1 for bounce)
 * @param x2 - Control point 2 X (0 to 1)
 * @param y2 - Control point 2 Y (can go beyond 0-1 for bounce)
 */
export const createBezier = (x1: number, y1: number, x2: number, y2: number) => {
  // Helpers for the cubic formula coefficients
  const cx = 3.0 * x1;
  const bx = 3.0 * (x2 - x1) - cx;
  const ax = 1.0 - cx - bx;

  const cy = 3.0 * y1;
  const by = 3.0 * (y2 - y1) - cy;
  const ay = 1.0 - cy - by;

  const getX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const getY = (t: number) => ((ay * t + by) * t + cy) * t;
  const getSlope = (t: number) => 3.0 * ax * t * t + 2.0 * bx * t + cx;

  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;

    // Newton-Raphson iteration to find 't' for the given 'x'
    let t = x;
    for (let i = 0; i < 8; i++) {
      const currentX = getX(t) - x;
      const slope = getSlope(t);
      if (Math.abs(slope) < 1e-6) break;
      t -= currentX / slope;
    }

    return getY(t);
  };
};