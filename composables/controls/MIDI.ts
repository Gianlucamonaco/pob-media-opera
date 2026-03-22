import { useAudioManager } from "../audio/manager";
import { useSceneBridge } from "../scene/bridge";
import { useSceneManager } from "../scene/manager";
import { useDebug } from "~/composables/state";

/** 
 * MIDI controls
 * - knob 7: Rotate camera 0 to 360 degrees
 * - pad  4: Clear audio and screen positions
 * - pad  16: End scene
 * - pads 17-40: Set scene 1 to 24
 */
export const midiState = reactive({
  knobs: {
    knob1:  0, knob2:  0, knob3:  0, knob4:  0, knob5:  0, knob6:  0,
    knob7:  0, knob8:  0, knob9:  0, knob10: 0, knob11: 0, knob12: 0,
  },
  pads: {
    pad1:  0, pad2:  0, pad3:  0, pad4:  0, pad5:  0, pad6:  0, pad7:  0, pad8:  0,
    pad9:  0, pad10: 0, pad11: 0, pad12: 0, pad13: 0, pad14: 0, pad15: 0, pad16: 0,
    pad17: 0, pad18: 0, pad19: 0, pad20: 0, pad21: 0, pad22: 0, pad23: 0, pad24: 0,
    pad25: 0, pad26: 0, pad27: 0, pad28: 0, pad29: 0, pad30: 0, pad31: 0, pad32: 0,
    pad33: 0, pad34: 0, pad35: 0, pad36: 0, pad37: 0, pad38: 0, pad39: 0, pad40: 0,
  }
});


const CC_MAP: Record<number, (v: number) => void> = {

  // Knobs
  3: (v) => {
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

  16: (v) => {
    // K7: rotate camera 0 to 360 degrees
    const engine = useSceneManager();
    const { azimuth, polar } = engine.getCameraAngles() ?? { azimuth: 0, polar: 0 };
    const delta = v - midiState.knobs.knob1;

    useSceneManager().cameraRotate(azimuth + delta * 360, polar);

    midiState.knobs.knob7 = v;
    if (useDebug().value) console.log('Knob 7:', v)
  },

  17: (v) => {
    midiState.knobs.knob8 = v;
    if (useDebug().value) console.log('Knob 8:', v)
  },

  18: (v) => {
    midiState.knobs.knob9 = v;
    if (useDebug().value) console.log('Knob 9:', v)
  },

  19: (v) => {
    midiState.knobs.knob10 = v;
    if (useDebug().value) console.log('Knob 10:', v)
  },

  20: (v) => {
    midiState.knobs.knob11 = v;
    if (useDebug().value) console.log('Knob 11:', v)
  },

  21: (v) => {
    midiState.knobs.knob12 = v;
    if (useDebug().value) console.log('Knob 12:', v)
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
    midiState.pads.pad3 = v;
    if (useDebug().value) console.log('Pad 3:', v)
  },

  39: (v) => {
    // P4: trigger clear audio and screen positions
    if (v == 1) {
      useAudioManager().reset(undefined, false);
      useSceneBridge().clearAllScreenPositions();
    }

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
    // P16: trigger end scene
    if (v == 1) useSceneManager().endScene();

    midiState.pads.pad16 = v;
    if (useDebug().value) console.log('Pad 16:', v)
  },

  52: (v) => {
    if (v == 1) useSceneManager().initScene(0);

    midiState.pads.pad17 = v;
    if (useDebug().value) console.log('Pad 17:', v)
  },

  53: (v) => {
    if (v == 1) useSceneManager().initScene(1);

    midiState.pads.pad18 = v;
    if (useDebug().value) console.log('Pad 18:', v)
  },

  54: (v) => {
    if (v == 1) useSceneManager().initScene(2);

    midiState.pads.pad19 = v;
    if (useDebug().value) console.log('Pad 19:', v)
  },

  55: (v) => {
    if (v == 1) useSceneManager().initScene(3);

    midiState.pads.pad20 = v;
    if (useDebug().value) console.log('Pad 20:', v)
  },

  56: (v) => {
    if (v == 1) useSceneManager().initScene(4);

    midiState.pads.pad21 = v;
    if (useDebug().value) console.log('Pad 21:', v)
  },

  57: (v) => {
    if (v == 1) useSceneManager().initScene(5);

    midiState.pads.pad22 = v;
    if (useDebug().value) console.log('Pad 22:', v)
  },

  58: (v) => {
    if (v == 1) useSceneManager().initScene(6);

    midiState.pads.pad23 = v;
    if (useDebug().value) console.log('Pad 23:', v)
  },

  59: (v) => {
    if (v == 1) useSceneManager().initScene(7);

    midiState.pads.pad24 = v;
    if (useDebug().value) console.log('Pad 24:', v)
  },

  60: (v) => {
    if (v == 1) useSceneManager().initScene(8);

    midiState.pads.pad25 = v;
    if (useDebug().value) console.log('Pad 25:', v)
  },

  61: (v) => {
    if (v == 1) useSceneManager().initScene(9);

    midiState.pads.pad26 = v;
    if (useDebug().value) console.log('Pad 26:', v)
  },

  62: (v) => {
    if (v == 1) useSceneManager().initScene(10);

    midiState.pads.pad27 = v;
    if (useDebug().value) console.log('Pad 27:', v)
  },

  63: (v) => {
    if (v == 1) useSceneManager().initScene(11);

    midiState.pads.pad28 = v;
    if (useDebug().value) console.log('Pad 28:', v)
  },

  64: (v) => {
    if (v == 1) useSceneManager().initScene(12);

    midiState.pads.pad29 = v;
    if (useDebug().value) console.log('Pad 29:', v)
  },

  65: (v) => {
    if (v == 1) useSceneManager().initScene(13);

    midiState.pads.pad30 = v;
    if (useDebug().value) console.log('Pad 30:', v)
  },

  66: (v) => {
    if (v == 1) useSceneManager().initScene(14);

    midiState.pads.pad31 = v;
    if (useDebug().value) console.log('Pad 31:', v)
  },

  67: (v) => {
    if (v == 1) useSceneManager().initScene(15);

    midiState.pads.pad32 = v;
    if (useDebug().value) console.log('Pad 32:', v)
  },

  68: (v) => {
    if (v == 1) useSceneManager().initScene(16);

    midiState.pads.pad33 = v;
    if (useDebug().value) console.log('Pad 33:', v)
  },

  69: (v) => {
    if (v == 1) useSceneManager().initScene(17);

    midiState.pads.pad34 = v;
    if (useDebug().value) console.log('Pad 34:', v)
  },

  70: (v) => {
    if (v == 1) useSceneManager().initScene(18);

    midiState.pads.pad35 = v;
    if (useDebug().value) console.log('Pad 35:', v)
  },

  71: (v) => {
    if (v == 1) useSceneManager().initScene(19);

    midiState.pads.pad36 = v;
    if (useDebug().value) console.log('Pad 36:', v)
  },

  72: (v) => {
    if (v == 1) useSceneManager().initScene(20);

    midiState.pads.pad37 = v;
    if (useDebug().value) console.log('Pad 37:', v)
  },

  73: (v) => {
    if (v == 1) useSceneManager().initScene(21);

    midiState.pads.pad38 = v;
    if (useDebug().value) console.log('Pad 38:', v)
  },

  74: (v) => {
    if (v == 1) useSceneManager().initScene(22);

    midiState.pads.pad39 = v;
    if (useDebug().value) console.log('Pad 39:', v)
  },

  75: (v) => {
    if (v == 1) useSceneManager().initScene(23);

    midiState.pads.pad40 = v;
    if (useDebug().value) console.log('Pad 40:', v)
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