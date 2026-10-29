import path from "node:path";
import { fileURLToPath } from "node:url";
import { BrowserWindow, app } from "electron";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 640,
    minHeight: 480,
    backgroundColor: "#090d16",
    autoHideMenuBar: true,
    fullscreenable: true,
    title: "Shifting Jigsaw Matrix",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.setMenuBarVisibility(false);

  // Handle F11 for fullscreen toggle and Escape to exit fullscreen
  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (input.type === "keyDown") {
      if (input.key === "F11") {
        event.preventDefault();
        mainWindow.setFullScreen(!mainWindow.isFullScreen());
      } else if (input.key === "Escape" && mainWindow.isFullScreen()) {
        event.preventDefault();
        mainWindow.setFullScreen(false);
      }
    }
  });

  const indexPath = path.join(__dirname, "../dist/index.html");
  mainWindow.loadFile(indexPath);
}

app.whenReady().then(() => {
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

