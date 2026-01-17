/** Returns a value that repeats on specified duration (in seconds) */
export const sinCycle = (time: number, duration: number = 1, amount: number = 1) => {
  const s = time / 120 * Math.PI * 2; // 1 sec full cycle

  return Math.sin(s / duration) * amount;
}