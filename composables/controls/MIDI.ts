import { useSceneManager } from "../scene/manager";

/** 
 * MIDI controls
 * - knob 1: Rotate camera 0 to 360
 * - knobs 2-6: No preset
 * - pad 1: No preset
 * - pads 2-8: No preset
 */
export const midiState = reactive({
  knob1: 0,
  knob2: 0,
  knob3: 0,
  knob4: 0,
  knob5: 0,
  knob6: 0,
  pad1: 0,
  pad2: 0,
  pad3: 0,
  pad4: 0,
  pad5: 0,
  pad6: 0,
  pad7: 0,
  pad8: 0,
});

const CC_MAP: Record<number, (v: number) => void> = {

  // Knobs
  3: (v) => {
    const engine = useSceneManager();
    const { azimuth, polar } = engine.getCameraAngles() ?? { azimuth: 0, polar: 0 };
    const delta = v - midiState.knob1;

    useSceneManager().cameraRotate(azimuth + delta * 360, polar);

    midiState.knob1 = v;
    if (useDebug().value) console.log('Knob 1:', v)
  },

  9: (v) => {
    midiState.knob2 = v;
    if (useDebug().value) console.log('Knob 2:', v)
  },

  12: (v) => {
    midiState.knob3 = v;
    if (useDebug().value) console.log('Knob 3:', v)
  },

  13: (v) => {
    midiState.knob4 = v;
    if (useDebug().value) console.log('Knob 4:', v)
  },

  14: (v) => {
    midiState.knob5 = v;
    if (useDebug().value) console.log('Knob 5:', v)
  },

  15: (v) => {
    midiState.knob6 = v;
    if (useDebug().value) console.log('Knob 6:', v)
  },

  // Pads
  36: (v) => {
    midiState.pad1 = v;
    if (useDebug().value) console.log('Pad 1:', v)
  },

  37: (v) => {
    midiState.pad2 = v;
    if (useDebug().value) console.log('Pad 2:', v)
  },

  38: (v) => {
    midiState.pad3 = v;
    if (useDebug().value) console.log('Pad 3:', v)
  },

  39: (v) => {
    midiState.pad4 = v;
    if (useDebug().value) console.log('Pad 4:', v)
  },

  40: (v) => {
    midiState.pad5 = v;
    if (useDebug().value) console.log('Pad 5:', v)
  },

  41: (v) => {
    midiState.pad6 = v;
    if (useDebug().value) console.log('Pad 6:', v)
  },

  42: (v) => {
    midiState.pad7 = v;
    if (useDebug().value) console.log('Pad 7:', v)
  },

  43: (v) => {
    midiState.pad8 = v;
    if (useDebug().value) console.log('Pad 8:', v)
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