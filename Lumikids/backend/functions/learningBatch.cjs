const { createHash } = require("node:crypto");
const { canonicalJson } = require("./curriculum/services/phygital/worksheetLayout");
const { applyOperation, InvalidOperation } = require("./learning.cjs");

const equipDevice = item => item.operation?.type === "equip" ? item.id.slice(0, 32) : null;

function operationSequence(id) {
  if (typeof id !== "string" || !/^[a-f0-9]{32}-[1-9]\d{0,15}$/.test(id)) return null;
  const sequence = Number(id.slice(33));
  // Keep the decimal client journal ID format and only compare exact integers.
  return Number.isSafeInteger(sequence) ? sequence : null;
}

function applyLearningBatch(profile, operations, existing, wallet, storedCheckpoints) {
  const accepted = [], supersededEquip = [], rejected = [], receipts = new Map(), checkpoints = new Map();
  let changed = false, walletChanged = false;
  for (const [index, item] of operations.entries()) {
    const sequence = operationSequence(item.id);
    if (sequence === null) {
      rejected.push({ id: item.id, reason: "invalid-operation" });
      continue;
    }
    let digest;
    try { digest = createHash("sha256").update(canonicalJson(item.operation)).digest("hex"); }
    catch (error) {
      if (!(error instanceof RangeError)) throw error;
      rejected.push({ id: item.id, reason: "invalid-operation" });
      continue;
    }
    const previous = existing[index];
    if (previous && previous.digest !== digest) {
      rejected.push({ id: item.id, reason: "receipt-conflict" });
      continue;
    }
    const waitingAt = Number.isSafeInteger(previous?.waitingAt) ? previous.waitingAt : undefined;
    if (previous && waitingAt === undefined) {
      accepted.push(item.id);
      if (previous.superseded === true) supersededEquip.push(item.id);
      continue;
    }

    const device = equipDevice(item);
    const checkpoint = device ? checkpoints.get(device) ?? storedCheckpoints.get(device) : undefined;
    const appliedSequence = checkpoint?.sequence ?? 0;
    const terminalSequence = Math.max(appliedSequence, checkpoint?.terminalSequence ?? 0);
    // Consecutive choices from one device must not invalidate its newer pending choices.
    // Version-only legacy heads cannot establish that history, so retain the old check for them.
    const otherDeviceVersion = device === wallet.device ? wallet.otherDeviceVersion ?? wallet.version : wallet.version;
    const superseded = device && (sequence <= terminalSequence ||
      (waitingAt !== undefined && waitingAt < otherDeviceVersion));
    const candidate = structuredClone(profile);
    try { applyOperation(candidate, item.operation); }
    catch (error) {
      if (!(error instanceof InvalidOperation)) throw error;
      if (!(superseded && error.reason === "dependency")) {
        if (device && error.reason === "dependency" && waitingAt === undefined) {
          receipts.set(item.id, { digest, waitingAt: wallet.version });
        }
        rejected.push({ id: item.id, reason: error.reason });
        continue;
      }
    }
    if (superseded) {
      receipts.set(item.id, { digest, superseded: true });
      supersededEquip.push(item.id);
    } else {
      profile = candidate;
      changed = true;
      receipts.set(item.id, { digest });
      if (device) {
        wallet = { version: wallet.version + 1, device, otherDeviceVersion };
        walletChanged = true;
      }
    }
    if (device && sequence > terminalSequence) {
      checkpoints.set(device, { sequence: superseded ? appliedSequence : sequence, terminalSequence: sequence });
    }
    accepted.push(item.id);
  }
  return { profile, accepted, supersededEquip, rejected, receipts, changed, walletChanged, wallet, checkpoints };
}

module.exports = { applyLearningBatch, equipDevice, operationSequence };
