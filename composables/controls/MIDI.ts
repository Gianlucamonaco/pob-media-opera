/** 
 * MIDI controls
 * - 1 (cc3): Rotate camera 0 to 360
 * - 2 (cc9): ...
 * - 3 (cc12): ...
 * - 4 (cc13): ...
 */
export class MIDIControls {
  constructor () {
    this.handleEvents()
  }

  handleEvents() {
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess({ sysex: false }).then(this.onMIDISuccess, this.onMIDIFailure);
    } else {
      console.error("Web MIDI is not supported in this browser.");
    }

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
    const channel = status & 0xf;
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

      switch (note) {
        case 3: // knob 1
          cameraEvents.ROTATE(velocity / 127 * 360, 0, 0)
          break;
        case 9: // knob 2
          break;
        case 12: // knob 3
          break;
        case 13: // knob 4
          break;
        case 14: // knob 5
          break;
        case 15: // knob 6
          break;
      } 
    }
  }
    
}
