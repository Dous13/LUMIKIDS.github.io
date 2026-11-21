const { readFileSync } = require("node:fs");
const http = require("node:http");
const https = require("node:https");
const { isIP } = require("node:net");
const express = require("express");
const { applicationDefault, cert, initializeApp } = require("firebase-admin/app");

const loopback = "127.0.0.1";
const demoProject = "demo-lumikids";
const liveProject = "lumikids-a94d8";
const routes = ["loginStudent", "syncStudentLearning", "syncWorksheet"];
const emulatorVariables = [
  "FUNCTIONS_EMULATOR", "FIREBASE_AUTH_EMULATOR_HOST", "FIRESTORE_EMULATOR_HOST", "FIREBASE_EMULATOR_HUB",
];

function loopbackEndpoint(value) {
  const match = /^127\.0\.0\.1:([1-9]\d{0,4})$/.exec(value);
  if (!match || Number(match[1]) > 65535) throw new Error("Use a 127.0.0.1 emulator endpoint with a valid port.");
  return value;
}

function readConfig(env = process.env) {
  const mode = env.LUMIKIDS_BACKEND_MODE;
  if (mode !== "emulator" && mode !== "live") throw new Error("Set LUMIKIDS_BACKEND_MODE to emulator or live.");
  if (env.FIREBASE_DEBUG_FEATURES || env.FUNCTIONS_EMULATOR) {
    throw new Error("Run the standalone backend without Functions emulator or debug flags.");
  }
  if (mode === "live" && emulatorVariables.some(name => env[name])) {
    throw new Error("Remove Firebase emulator settings before starting in live mode.");
  }
  const keyPath = env.LUMIKIDS_SERVICE_ACCOUNT_KEY_PATH;
  if (mode === "emulator" && (env.GOOGLE_APPLICATION_CREDENTIALS || env.LUMIKIDS_SERVICE_ACCOUNT_ID || keyPath ||
      env.LOGIN_TRUSTED_SOURCE_HEADER === "1")) {
    throw new Error("Remove explicitly configured Google credentials, signing identity, and trusted ingress before local testing.");
  }
  if (keyPath && (env.GOOGLE_APPLICATION_CREDENTIALS || env.LUMIKIDS_SERVICE_ACCOUNT_ID)) {
    throw new Error("Choose a service-account key or Application Default Credentials for the standalone server.");
  }
  const projectId = mode === "emulator" ? demoProject : liveProject;
  for (const name of ["GCLOUD_PROJECT", "GOOGLE_CLOUD_PROJECT"]) {
    if (env[name] && env[name] !== projectId) throw new Error(name + " does not match " + projectId + ".");
  }
  const port = Number(env.LUMIKIDS_BACKEND_PORT ?? "5002");
  if (!/^\d{1,5}$/.test(env.LUMIKIDS_BACKEND_PORT ?? "5002") || port > 65535) {
    throw new Error("LUMIKIDS_BACKEND_PORT must be a port number from 0 through 65535.");
  }
  const host = env.LUMIKIDS_BACKEND_HOST ?? loopback;
  const tlsCert = env.LUMIKIDS_BACKEND_TLS_CERT_PATH;
  const tlsKey = env.LUMIKIDS_BACKEND_TLS_KEY_PATH;
  if (isIP(host) !== 4 || (host !== loopback && (mode === "emulator" || !tlsCert || !tlsKey))) {
    throw new Error("Use loopback or configure direct HTTPS on an IPv4 address in live mode.");
  }
  if (!!tlsCert !== !!tlsKey || (tlsCert && env.LOGIN_TRUSTED_SOURCE_HEADER === "1")) {
    throw new Error("Direct HTTPS requires both TLS files and uses the socket peer for login quotas.");
  }
  const origins = new Set((env.LUMIKIDS_ALLOWED_ORIGINS ?? "").split(",").map(value => value.trim()).filter(Boolean));
  for (const origin of origins) {
    const url = URL.parse(origin);
    if (!url || url.origin !== origin || (url.protocol !== "https:" &&
        !(mode === "emulator" && url.protocol === "http:" && ["127.0.0.1", "localhost"].includes(url.hostname)))) {
      throw new Error("LUMIKIDS_ALLOWED_ORIGINS must contain exact HTTPS origins or local HTTP origins in emulator mode.");
    }
  }
  const emulators = mode === "emulator" ? {
    FIREBASE_AUTH_EMULATOR_HOST: loopbackEndpoint(env.FIREBASE_AUTH_EMULATOR_HOST ?? "127.0.0.1:9099"),
    FIRESTORE_EMULATOR_HOST: loopbackEndpoint(env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080"),
    METADATA_SERVER_DETECTION: "none",
  } : null;
  return { projectId, host, port, origins, emulators, keyPath, tlsCert, tlsKey,
    serviceAccountId: env.LUMIKIDS_SERVICE_ACCOUNT_ID };
}

function liveCredential({ keyPath, projectId }) {
  if (!keyPath) return applicationDefault();
  try {
    const key = JSON.parse(readFileSync(keyPath, "utf8"));
    if (key?.type === "service_account" && key.project_id === projectId) return cert(key);
  } catch {
    // Keep file contents and parse errors out of the startup log.
  }
  throw new Error("The standalone server needs a readable service-account key for " + projectId + ".");
}

function respondError(res, httpStatus, status, message) {
  return res.status(httpStatus).json({ error: { status, message } });
}

function startStandalone() {
  const config = readConfig();
  const { host, port, tlsCert, tlsKey } = config;
  const transportOptions = { headersTimeout: 10_000, requestTimeout: 30_000 };
  let server;
  if (tlsCert) {
    try {
      server = https.createServer({ ...transportOptions, cert: readFileSync(tlsCert), key: readFileSync(tlsKey),
        minVersion: "TLSv1.2" });
    } catch {
      throw new Error("The standalone server could not load the TLS certificate and private key.");
    }
  } else {
    server = http.createServer(transportOptions);
  }
  if (config.emulators) Object.assign(process.env, config.emulators);
  initializeApp(config.emulators ? { projectId: config.projectId } : {
    projectId: config.projectId,
    credential: liveCredential(config),
    serviceAccountId: config.serviceAccountId,
  });
  const handlers = require("./index.cjs");
  const app = express();
  app.disable("x-powered-by");
  app.enable("strict routing");
  app.enable("case sensitive routing");
  app.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    res.vary("Origin");
    const origin = req.get("Origin");
    if (origin && !config.origins.has(origin)) return respondError(res, 403, "PERMISSION_DENIED", "Origin is not allowed.");
    if (origin) res.set("Access-Control-Allow-Origin", origin);
    next();
  });

  app.get("/healthz", (_req, res) => res.type("text/plain").send("ok"));

  const parse = express.json({ limit: 1_600_000, inflate: false });
  for (const name of routes) {
    const route = app.route("/" + name);
    route.options(handlers[name]);
    route.post(parse, (req, res) => {
      if (!req.body || Array.isArray(req.body) || !Object.hasOwn(req.body, "data") || Object.keys(req.body).length !== 1) {
        return respondError(res, 400, "INVALID_ARGUMENT", "Expected a Firebase callable request.");
      }
      return handlers[name](req, res);
    });
    route.all((req, res) => {
      res.set("Allow", "POST, OPTIONS");
      return respondError(res, 405, "INVALID_ARGUMENT", "Use POST for callable requests.");
    });
  }
  app.use((_req, res) => respondError(res, 404, "NOT_FOUND", "Callable not found."));
  app.use((error, _req, res, next) => {
    if (res.headersSent) return next(error);
    if (error.status === 413) return respondError(res, 413, "RESOURCE_EXHAUSTED", "Request body is too large.");
    if (error.status === 415) return respondError(res, 415, "INVALID_ARGUMENT", "Unsupported request encoding.");
    if (error.status === 400) return respondError(res, 400, "INVALID_ARGUMENT", "Invalid JSON request.");
    return respondError(res, 500, "INTERNAL", "Internal server error.");
  });

  server.on("request", app);
  return server.listen(port, host, () => {
    console.log(`LUMIKIDS standalone (${config.projectId}) listening at ${tlsCert ? "https" : "http"}://${host}:${server.address().port}`);
  });
}

if (require.main === module) {
  try {
    startStandalone().on("error", error => {
      console.error(error.message);
      process.exitCode = 1;
    });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { readConfig, startStandalone };
