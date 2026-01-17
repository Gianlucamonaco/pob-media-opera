import { KeyboardControls } from './keyboard';
import { MIDIControls } from './MIDI';

let keyboard: KeyboardControls | null = null;
let midi: MIDIControls | null = null;

export const useControlsManager = () => {
  const init = () => {
    if (!keyboard) keyboard = new KeyboardControls();
    if (!midi) midi = new MIDIControls();
  };

  const destroy = () => {
    keyboard?.destroy();
    midi?.destroy();
    keyboard = null;
    midi = null;
  };

  return {
    init,
    destroy,
  };
};