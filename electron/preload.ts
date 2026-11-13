/**
 * Electron Preload Script
 *
 * Runs in the renderer process BEFORE the page loads.
 * Securely exposes a subset of Electron APIs to the web page
 * via contextBridge. The page can access these through
 * `window.electronAPI`.
 */

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  /**
   * Opens a native OS directory picker dialog.
   * Returns the selected folder path, or null if cancelled.
   */
  selectDirectory: (): Promise<string | null> => {
    return ipcRenderer.invoke("dialog:openDirectory");
  },

  /**
   * Check if we're running inside Electron.
   */
  isElectron: true,

  /**
   * Get the platform (darwin, win32, linux).
   */
  platform: process.platform,
});
