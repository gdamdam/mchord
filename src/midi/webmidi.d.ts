// Minimal Web MIDI type augmentation. No runtime dependency.
//
// The DOM lib ships the MIDIAccess / MIDIOutput / MIDIInput interfaces, but
// `Navigator.requestMIDIAccess` is not always present in the TS DOM lib (it is
// gated behind the Web MIDI spec). We declare just enough to call it without
// `any`, and we keep our own structural aliases so the router compiles even in
// a `node` test environment where the DOM lib is the only source of these types.

export {}

declare global {
  interface MIDIOptions {
    sysex?: boolean
    software?: boolean
  }

  interface Navigator {
    requestMIDIAccess?: (options?: MIDIOptions) => Promise<MIDIAccess>
  }
}
