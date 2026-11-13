/**
 * Type declarations for the Electron preload API.
 *
 * The preload script exposes `window.electronAPI` via contextBridge.
 * This file ensures TypeScript knows about it in the renderer (Next.js) code.
 */

interface ElectronAPI {
  /** Opens a native OS directory picker dialog. Returns the path or null. */
  selectDirectory: () => Promise<string | null>;
  /** True when running inside Electron. */
  isElectron: boolean;
  /** The host platform: 'darwin', 'win32', or 'linux'. */
  platform: string;
}

interface Window {
  electronAPI?: ElectronAPI;
}
