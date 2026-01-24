/* ------------------------------
   Canvas Utilities
   ------------------------------ */

/**
 * Scale a canvas for high-DPI (retina) displays.
 * @param canvas HTMLCanvasElement to scale
 * @param context CanvasRenderingContext2D or WebGL context
 * @param width CSS width
 * @param height CSS height
 */
export const scaleCanvas = (
  canvas: HTMLCanvasElement | OffscreenCanvas,
  context: any,
  width: number,
  height: number
) => {
  const devicePixelRatio = window.devicePixelRatio || 1;

  const backingStoreRatio =
    context.webkitBackingStorePixelRatio ||
    context.mozBackingStorePixelRatio ||
    context.msBackingStorePixelRatio ||
    context.oBackingStorePixelRatio ||
    context.backingStorePixelRatio ||
    1;

  const ratio = devicePixelRatio / backingStoreRatio;

  if (devicePixelRatio !== backingStoreRatio) {
    canvas.width = width * ratio;
    canvas.height = height * ratio;

    if (canvas instanceof HTMLCanvasElement && canvas.style) {
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
    }
  }
  else {
    canvas.width = width;
    canvas.height = height;

    if (canvas instanceof HTMLCanvasElement && canvas.style) {
      canvas.style.width = "";
      canvas.style.height = "";
    }
  }

  context.scale(ratio, ratio);
};
