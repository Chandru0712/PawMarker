const { spawn } = require("child_process");
const path = require("path");

// Start Vite dev server and Electron concurrently
let viteProcess;
let electronProcess;

const startVite = () => {
  return new Promise((resolve) => {
    viteProcess = spawn("npm", ["run", "dev:app"], {
      cwd: path.resolve(__dirname, "../../app"),
      stdio: "inherit",
    });

    setTimeout(resolve, 3000);
  });
};

const startElectron = () => {
  return new Promise((resolve) => {
    electronProcess = spawn("electron", ["."], {
      cwd: path.resolve(__dirname, ".."),
      stdio: "inherit",
    });

    electronProcess.on("exit", () => {
      viteProcess?.kill();
      process.exit(0);
    });

    resolve();
  });
};

(async () => {
  await startVite();
  await startElectron();
})();
