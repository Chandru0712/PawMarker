const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const path = require("path");
const { URL } = require("url");

const isDev = process.env.NODE_ENV === "development";

let mainWindow;
let startUrl;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    kiosk: true,
    fullscreen: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  startUrl = isDev
    ? "http://localhost:5173"
    : `file://${path.join(__dirname, "../app/dist/index.html")}`;

  mainWindow.loadURL(startUrl);

  // Deny all window.open() calls. This is a kiosk app with no external links.
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));

  // Block any navigation away from the start URL. Prevents a compromised
  // renderer (or a future stray <a href="...">) from navigating the app
  // to an attacker-controlled origin.
  mainWindow.webContents.on("will-navigate", (event, targetUrl) => {
    try {
      const target = new URL(targetUrl);
      const start = new URL(startUrl);
      if (target.origin !== start.origin || target.pathname !== start.pathname) {
        event.preventDefault();
      }
    } catch {
      event.preventDefault();
    }
  });

  // if (isDev) {
  //   mainWindow.webContents.openDevTools();
  // }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

// Defense-in-depth: refuse to attach <webview> tags and deny permission
// requests for capabilities the app does not use (camera, mic, geolocation, ...).
app.on("web-contents-created", (_event, contents) => {
  contents.on("will-attach-webview", (event) => {
    event.preventDefault();
  });
  contents.session.setPermissionRequestHandler((_wc, _permission, callback) => {
    callback(false);
  });
});

app.whenReady().then(() => {
  createWindow();
  // Kiosk: no application menu in production.
  Menu.setApplicationMenu(null);
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});

ipcMain.handle("get-app-path", () => {
  return app.getAppPath();
});

ipcMain.handle("quit-app", () => {
  app.quit();
});

// Development-only menu. In production the application menu stays null
// (set in the main whenReady handler above) so DevTools / Reload / Copy /
// Paste cannot be reached from the menu bar in a kiosk deployment.
const createDevMenu = () => {
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "Exit",
          accelerator: "CmdOrCtrl+Q",
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { label: "Undo", accelerator: "CmdOrCtrl+Z", role: "undo" },
        { label: "Redo", accelerator: "CmdOrCtrl+Y", role: "redo" },
        { type: "separator" },
        { label: "Cut", accelerator: "CmdOrCtrl+X", role: "cut" },
        { label: "Copy", accelerator: "CmdOrCtrl+C", role: "copy" },
        { label: "Paste", accelerator: "CmdOrCtrl+V", role: "paste" },
      ],
    },
    {
      label: "View",
      submenu: [
        { label: "Reload", accelerator: "CmdOrCtrl+R", role: "reload" },
        {
          label: "Toggle Developer Tools",
          accelerator: "CmdOrCtrl+Shift+I",
          click: () => {
            mainWindow?.webContents.toggleDevTools();
          },
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
};

if (isDev) {
  app.whenReady().then(() => {
    createDevMenu();
  });
}
