/* ------------------------------
   String Utilities
   ------------------------------ */

// Ref: https://stackoverflow.com/questions/1026069/how-do-i-make-the-first-letter-of-a-string-uppercase-in-javascript?page=1&tab=scoredesc#tab-top

/**
 * Convert the first letter of a string to lowercase
 * @param value Input string
 * @returns String with lowercase first letter
 */
export const toLowercaseFirstLetter = (value: string): string =>
  value.charAt(0).toLowerCase() + value.slice(1);

/**
 * Convert the first letter of a string to uppercase
 * @param value Input string
 * @returns String with uppercase first letter
 */
export const toUppercaseFirstLetter = (value: string): string =>
  value.charAt(0).toUpperCase() + value.slice(1);

