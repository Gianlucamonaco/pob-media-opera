/* ------------------------------
   Array Utilities
   ------------------------------ */

// Ref: https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array

/**
 * Shuffle an array in place (Fisher–Yates algorithm)
 * @param array Array to shuffle
 */
export const shuffle = (array: any[]): void => {
  let currentIndex = array.length;
  while (currentIndex !== 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
};