import { clamp, mapLinear } from "three/src/math/MathUtils.js";
import { Base2D } from "./base";

export class TextLines extends Base2D {
  text: string[];
  fontSize: number;
  progress = 0;

  constructor (params: any) {
    super(params);
    this.fontSize = params.fontSize ?? 48;
    this.text = params.content ?? ['ajo'];
  }

  override update () {
    const { canvas, ctx } = use2DScene().value;

    if (!ctx || !canvas) return;

    const { $wsAudio } = useNuxtApp() as any;
    const channelInput = $wsAudio[2];

    let totalCount = this.text.reduce((acc, val) => { return acc += val.length }, 0);
    let charIndex = 0;

    for (let l = 0; l < this.text.length; l++) {
      
      let letterPos = 0;

      const line = this.text[l]?.split('') ?? [];

      for (let c = 0; c < line.length; c ++) {
        // Multi line highlight based on cos of progress
        const val = 0.5 + Math.cos(((this.progress * 0.25 - charIndex) / Math.PI * 180) * 0.0005) * 0.5;

        // Single line highlight based on progress value
        // const val = clamp(mapLinear(Math.abs(((this.progress*0.5) % totalCount) - charIndex), 0, 20, 1, 0), 0, 1);

        // Multi line highlight based on frequency (note: need to keep track of latest freq value)
        // const val = clamp(mapLinear(Math.cos((((channelInput[1] * 200 + this.progress * 1.5) / 500 + charIndex * 0.1) / Math.PI * 180) / 200), -1, 1, -20, 1), 0, channelInput[0] * 15);

        // Single line highlight based on frequency (note: freq progress is not linear, to adjust)
        // const freq = mapLinear(channelInput[1], 220, 880, 0, totalCount)
        // const val = clamp(mapLinear(Math.abs((freq % totalCount) - charIndex), 0, 100 + 100 * channelInput[0], 1, 0), 0, 1.5);

        ctx.font = `${this.fontSize + val * 24}px Instrument Serif`;
        ctx.globalAlpha = val;

        const char = line[c] ?? '';
        ctx?.fillText(char, this.position.x + letterPos, this.position.y + this.fontSize + l * (this.fontSize + 24));

        letterPos += ctx.measureText(char).width;
        charIndex++;
      }
    }

    this.progress++;
  }
}