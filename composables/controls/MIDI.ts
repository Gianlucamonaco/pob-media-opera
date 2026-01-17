
const CC_MAP: Record<number, (v: number) => void> = {
  // knob 1
  3: (v) => cameraEvents.ROTATE(v / 127 * 360, 0, 0),

  // knob 2
  9: (v) => {},

  // knob 3
  12: (v) => {},

  // knob 4
  13: (v) => {},

  // knob 5
  14: (v) => {},

  // knob 6
  15: (v) => {},
};

/** 
 * MIDI controls
 * - 1 (cc3): Rotate camera 0 to 360
 * - 2 (cc9): ...
 * - 3 (cc12): ...
 * - 4 (cc13): ...
 */
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
      console.log(`Pad pressed: note=${note} velocity=${velocity}`);
    }

    // Pad release (Note Off)
    if ((command === 8) || (command === 9 && velocity === 0)) {
      console.log(`Pad released: note=${note}`);
    }

    // Control Change (knobs, faders)
    if (command === 11) {
      // console.log(`CC ${note} = ${velocity}`);
      const value = velocity / 127;
      CC_MAP[note]?.(value);
    }
  }
    
}