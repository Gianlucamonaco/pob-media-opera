import { useAudioManager } from "../audio/manager";
import { useSceneBridge } from "../scene/bridge";
import { useSceneManager } from "../scene/manager";
import { useDebug } from "~/composables/state";

/** 
 * MIDI controls
 * - knob 1: Rotate camera 0 to 360
 * - knobs 2-6: No preset
 * - pad 1: No preset
 * - pads 2-8: No preset
 */
export const midiState = reactive({
  knobs: {
    knob1: 0, knob2: 0, knob3: 0, knob4: 0, knob5: 0, knob6: 0,
  },
  pads: {
    pad1:  0, pad2:  0, pad3:  0, pad4:  0, pad5:  0, pad6:  0, pad7:  0, pad8:  0,
    pad9:  0, pad10: 0, pad11: 0, pad12: 0, pad13: 0, pad14: 0, pad15: 0, pad16: 0,
    pad17: 0, pad18: 0, pad19: 0, pad20: 0, pad21: 0, pad22: 0, pad23: 0, pad24: 0,
    pad25: 0, pad26: 0, pad27: 0, pad28: 0, pad29: 0, pad30: 0, pad31: 0, pad32: 0,
  }
});


const CC_MAP: Record<number, (v: number) => void> = {

  // Knobs
  3: (v) => {
    const engine = useSceneManager();
    const { azimuth, polar } = engine.getCameraAngles() ?? { azimuth: 0, polar: 0 };
    const delta = v - midiState.knobs.knob1;

    useSceneManager().cameraRotate(azimuth + delta * 360, polar);

    midiState.knobs.knob1 = v;
    if (useDebug().value) console.log('Knob 1:', v)
  },

  9: (v) => {
    midiState.knobs.knob2 = v;
    if (useDebug().value) console.log('Knob 2:', v)
  },

  12: (v) => {
    midiState.knobs.knob3 = v;
    if (useDebug().value) console.log('Knob 3:', v)
  },

  13: (v) => {
    midiState.knobs.knob4 = v;
    if (useDebug().value) console.log('Knob 4:', v)
  },

  14: (v) => {
    midiState.knobs.knob5 = v;
    if (useDebug().value) console.log('Knob 5:', v)
  },

  15: (v) => {
    midiState.knobs.knob6 = v;
    if (useDebug().value) console.log('Knob 6:', v)
  },

  // Pads
  36: (v) => {
    midiState.pads.pad1 = v;
    if (useDebug().value) console.log('Pad 1:', v)
  },

  37: (v) => {
    midiState.pads.pad2 = v;
    if (useDebug().value) console.log('Pad 2:', v)
  },

  38: (v) => {
    // When pressed, trigger clear audio and screen positions
    if (v == 1) {
      useAudioManager().reset(undefined, false);
      useSceneBridge().clearAllScreenPositions();
    }

    midiState.pads.pad3 = v;
    if (useDebug().value) console.log('Pad 3:', v)
  },

  39: (v) => {
    // When pressed, trigger end scene
    if (v == 1) useSceneManager().endScene();

    midiState.pads.pad4 = v;
    if (useDebug().value) console.log('Pad 4:', v)
  },

  40: (v) => {
    midiState.pads.pad5 = v;
    if (useDebug().value) console.log('Pad 5:', v)
  },

  41: (v) => {
    midiState.pads.pad6 = v;
    if (useDebug().value) console.log('Pad 6:', v)
  },

  42: (v) => {
    midiState.pads.pad7 = v;
    if (useDebug().value) console.log('Pad 7:', v)
  },

  43: (v) => {
    midiState.pads.pad8 = v;
    if (useDebug().value) console.log('Pad 8:', v)
  },

  44: (v) => {
    midiState.pads.pad9 = v;
    if (useDebug().value) console.log('Pad 9:', v)
  },

  45: (v) => {
    midiState.pads.pad10 = v;
    if (useDebug().value) console.log('Pad 10:', v)
  },

  46: (v) => {
    midiState.pads.pad11 = v;
    if (useDebug().value) console.log('Pad 11:', v)
  },

  47: (v) => {
    midiState.pads.pad12 = v;
    if (useDebug().value) console.log('Pad 12:', v)
  },

  48: (v) => {
    midiState.pads.pad13 = v;
    if (useDebug().value) console.log('Pad 13:', v)
  },

  49: (v) => {
    midiState.pads.pad14 = v;
    if (useDebug().value) console.log('Pad 14:', v)
  },

  50: (v) => {
    midiState.pads.pad15 = v;
    if (useDebug().value) console.log('Pad 15:', v)
  },

  51: (v) => {
    midiState.pads.pad16 = v;
    if (useDebug().value) console.log('Pad 16:', v)
  },

  52: (v) => {
    midiState.pads.pad17 = v;
    if (useDebug().value) console.log('Pad 17:', v)
  },

  53: (v) => {
    midiState.pads.pad18 = v;
    if (useDebug().value) console.log('Pad 18:', v)
  },

};

export class MIDIControls {
  private midiAccess: MIDIAccess | null = null;

  constructor () {
    this.init()
  }

  async init() {
    if (!navigator.requestMIDIAccess) {
      console.error("Web MIDI is not supported in this browser.");
      return;
    }

    try {
      this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
      this.onMIDISuccess(this.midiAccess);
    } catch {
      this.onMIDIFailure();
    }
  }

  destroy() {
    if (!this.midiAccess) return;

    for (const input of this.midiAccess.inputs.values()) {
      input.onmidimessage = null;
    }

    this.midiAccess.onstatechange = null;
    this.midiAccess = null;
  }

  onMIDISuccess = (midiAccess: any) => {
    console.log("MIDI ready.");

    // Listen to all inputs
    for (const input of midiAccess.inputs.values()) {
      console.log("Found input:", input.name);
      input.onmidimessage = this.handleMIDIMessage;
    }

    // If new devices are plugged in later:
    midiAccess.onstatechange = (event: any) => {
      console.log(`MIDI device ${event.port.name} ${event.port.state} (${event.port.type})`);
    };
  }
  
  onMIDIFailure = () => {
    console.error("Could not access MIDI devices.");
  }

  handleMIDIMessage = (message: any) => {
    const [status, data1, data2] = message.data;

    const command = status >> 4;
    // const channel = status & 0xf;
    const note = data1;
    const velocity = data2;

    // Pad hit (usually Note On)
    if (command === 9 && velocity > 0) {
      // console.log(`Pad pressed: note=${note} velocity=${velocity}`);
      CC_MAP[note]?.(1);
    }

    // Pad release (Note Off)
    if ((command === 8) || (command === 9 && velocity === 0)) {
      // console.log(`Pad released: note=${note}`);
      CC_MAP[note]?.(0);
    }

    // Control Change (knobs, faders)
    if (command === 11) {
      // console.log(`CC ${note} = ${velocity}`);
      const value = velocity / 127;
      CC_MAP[note]?.(value);
    }
  }
}