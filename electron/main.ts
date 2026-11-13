/**
 * Electron Main Process
 *
 * Responsible for:
 * - Creating the application window
 * - In production: spawning the Next.js standalone server
 * - In dev: connecting to the Next.js dev server
 * - Providing IPC handlers for native OS dialogs
 */

import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { join } from "node:path";
import { spawn, type ChildProcess } from "node:child_process";

// ── Configuration ──────────────────────────────────────────────

const isDev = !app.isPackaged;
const DEV_SERVER_URL = "http://localhost:3000";
const PROD_PORT = 3456; // Use a non-standard port to avoid conflicts

let mainWindow: BrowserWindow | null = null;
let serverProcess: ChildProcess | null = null;

// ── Next.js Standalone Server (production only) ────────────────

function startNextServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    const serverPath = join(
      process.resourcesPath!,
      "standalone",
      "server.js"
    );

    serverProcess = spawn("node", [serverPath], {
      env: {
        ...process.env,
        PORT: String(PROD_PORT),
        HOSTNAME: "127.0.0.1",
        NODE_ENV: "production",
      },
      stdio: "pipe",
    });

    serverProcess.stdout?.on("data", (data: Buffer) => {
      const msg = data.toString();
      console.log("[next]", msg);
      // Resolve once the server signals it's ready
      if (msg.includes("Ready") || msg.includes("started server")) {
        resolve();
      }
    });

    serverProcess.stderr?.on("data", (data: Buffer) => {
      console.error("[next:err]", data.toString());
    });

    serverProcess.on("error", (err) => {
      console.error("Failed to start Next.js server:", err);
      reject(err);
    });

    serverProcess.on("exit", (code) => {
      console.log(`Next.js server exited with code ${code}`);
      serverProcess = null;
    });

    // Timeout: if server doesn't start within 15s, resolve anyway
    // (the window will retry loading)
    setTimeout(() => resolve(), 15_000);
  });
}

function stopNextServer(): void {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill("SIGTERM");
    serverProcess = null;
  }
}

// ── Window Creation ────────────────────────────────────────────

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: "Project Guardian",
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: "#09090b",
    show: false,
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const url = isDev
    ? DEV_SERVER_URL
    : `http://127.0.0.1:${PROD_PORT}`;

  mainWindow.loadURL(url);

  // Show window once content is ready (avoids white flash)
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  // Open devtools in development
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ── IPC Handlers ───────────────────────────────────────────────

function registerIPC(): void {
  // Native folder picker dialog
  ipcMain.handle("dialog:openDirectory", async () => {
    if (!mainWindow) return null;

    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory"],
      title: "Select Project Root Directory",
      buttonLabel: "Select Folder",
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });
}

// ── App Lifecycle ──────────────────────────────────────────────

app.whenReady().then(async () => {
  registerIPC();

  // In production, start the Next.js server first
  if (!isDev) {
    try {
      await startNextServer();
    } catch (err) {
      console.error("Failed to start server:", err);
    }
  }

  createWindow();

  app.on("activate", () => {
    // macOS: re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  stopNextServer();
  // On macOS, apps typically stay active until Cmd+Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  stopNextServer();
});
