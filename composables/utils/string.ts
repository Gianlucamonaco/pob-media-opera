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

/**
 * Wraps text into multiple lines based on a maximum width and renders them to a Canvas2D context.
 * @param ctx - The CanvasRenderingContext2D to use for measuring and drawing.
 * @param text - The string content to wrap.
 * @param x - The X coordinate for the text block.
 * @param y - The Y coordinate (starting line).
 * @param maxWidth - The maximum width in pixels before forcing a line break.
 * @param lineHeight - The vertical distance between lines (usually 1.2 * fontSize).
 */
export const wrapText = (
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): void => {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  
  // Draw the final remaining line
  ctx.fillText(line, x, currentY);
};