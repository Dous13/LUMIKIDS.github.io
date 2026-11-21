const { spawn } = require("node:child_process");
const { copyFileSync, existsSync, mkdtempSync, writeFileSync } = require("node:fs");
const { createServer } = require("node:net");
const { tmpdir } = require("node:os");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const mode = process.argv[2];

if (mode === "android") {
  // Use a stable demo bundle and skip Metro's Windows file-watcher startup.
  const env = {
    ...process.env, CI: "1", EXPO_PUBLIC_FIREBASE_EMULATOR_HOST: "10.0.2.2",
    EXPO_NO_CLIENT_ENV_VARS: "0", EXPO_OFFLINE: "1",
  };
  const sdk = env.ANDROID_HOME || env.ANDROID_SDK_ROOT || (env.LOCALAPPDATA && path.join(env.LOCALAPPDATA, "Android", "Sdk"));
  const cmakeProperty = "ORG_GRADLE_PROJECT_android.cmakeVersion";
  if (process.platform === "win32" && sdk && !env[cmakeProperty] &&
      existsSync(path.join(sdk, "cmake", "3.31.6", "bin", "ninja.exe"))) {
    env[cmakeProperty] = "3.31.6";
  }
  // Give the demo its own Metro instance even if regular Expo is already running.
  const port = 8090;
  const probe = createServer();
  probe.once("error", error => {
    console.error("Could not reserve demo Metro port " + port + ": " + error.message);
    process.exitCode = 1;
  });
  probe.listen(port, () => {
    probe.close(() => run([
      require.resolve("expo/bin/cli"), "run:android", "--variant", "debug", "--no-install", "--port", String(port),
    ], root, env));
  });
} else if (["emulators", "test", "standalone-test"].includes(mode)) {
  // Firebase writes emulator logs in its working directory. Keep each run's logs.
  const cwd = mkdtempSync(path.join(tmpdir(), "lumikids-firebase-"));
  console.log("Firebase emulator logs: " + cwd);
  const standalone = mode === "standalone-test";
  const env = { ...process.env, FUNCTIONS_DISCOVERY_TIMEOUT: process.env.FUNCTIONS_DISCOVERY_TIMEOUT ?? "45" };
  const args = [
    require.resolve("firebase-tools/lib/bin/firebase.js"),
    mode === "emulators" ? "emulators:start" : "emulators:exec",
    "--config", standalone ? standaloneEmulatorConfig(cwd) : path.join(root, "firebase.json"),
    "--only", standalone ? "auth,firestore" : "auth,firestore,functions",
    "--project", "demo-lumikids", "--non-interactive",
  ];
  if (mode !== "emulators") {
    const testFile = path.join(root, "tests", "firebase-emulator.test.cjs").replaceAll("\\", "/");
    args.push(`node --test "${testFile}"`);
  }
  if (standalone) {
    Object.assign(env, {
      TEMP: cwd, TMP: cwd, TMPDIR: cwd,
      LUMIKIDS_STANDALONE_TEST: "1",
      LUMIKIDS_BACKEND_MODE: "emulator",
      LUMIKIDS_BACKEND_PORT: "0",
      LUMIKIDS_ALLOWED_ORIGINS: "http://localhost:8081",
    });
  }
  run(args, cwd, env);
} else {
  throw new Error("Choose emulators, android, test, or standalone-test.");
}

function standaloneEmulatorConfig(cwd) {
  // A separate suite leaves any running demo accounts and emulator logs in place.
  const host = "127.0.0.1";
  const config = {
    firestore: { rules: "firestore.rules" },
    emulators: {
      auth: { host, port: 19099 },
      firestore: { host, port: 18080, websocketPort: 19150 },
      hub: { host, port: 14400 },
      logging: { host, port: 14500 },
      ui: { enabled: false },
      singleProjectMode: true,
    },
  };
  const filename = path.join(cwd, "firebase.json");
  copyFileSync(path.join(root, "firestore.rules"), path.join(cwd, "firestore.rules"));
  writeFileSync(filename, JSON.stringify(config));
  return filename;
}

function run(args, cwd, env) {
  const child = spawn(process.execPath, args, { cwd, env, stdio: "inherit" });
  child.on("error", error => {
    console.error(error.message);
    process.exitCode = 1;
  });
  child.on("exit", (code, signal) => {
    process.exitCode = code ?? (signal === "SIGINT" ? 130 : 1);
  });
}
