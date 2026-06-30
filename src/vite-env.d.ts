/// <reference types="vite/client" />

// Injected by Vite's `define` from package.json at build time.
declare const __APP_VERSION__: string

// AudioWorklet processors are bundled as separate ESM modules and loaded by URL
// via `audioWorklet.addModule(url)`. The `?worker&url` query asks Vite to emit
// the module as its own file and hand back its hashed URL string.
declare module '*?worker&url' {
  const src: string
  export default src
}
