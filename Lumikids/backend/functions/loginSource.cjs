const { isIP } = require("node:net");

const EMULATOR_SOURCE_HEADER = "x-lumikids-emulator-source";
const loopbackEndpoint = /^(?:127\.0\.0\.1|\[::1\]):\d+$/;

function normalizeIp(value) {
  return typeof value === "string" && isIP(value) ? value.replace(/^::ffff:/i, "").toLowerCase() : null;
}

function loginSource(request, env = process.env) {
  const peer = normalizeIp(request.socket?.remoteAddress);
  if (env.FUNCTIONS_EMULATOR === "true") {
    if (env.GCLOUD_PROJECT === "demo-lumikids" && loopbackEndpoint.test(env.FIREBASE_AUTH_EMULATOR_HOST) &&
        loopbackEndpoint.test(env.FIRESTORE_EMULATOR_HOST)) {
      const simulated = normalizeIp(request.headers[EMULATOR_SOURCE_HEADER]);
      if (simulated) return simulated;
    }
    // The emulator forwards worker requests over IPC, which has no IP peer.
    return peer ?? "127.0.0.1";
  }
  return env.LOGIN_TRUSTED_SOURCE_HEADER === "1" ? normalizeIp(request.headers["x-lumikids-client-ip"]) : peer;
}

module.exports = { loginSource, EMULATOR_SOURCE_HEADER };
