const crypto = require("crypto");
const secureStorage = require("../secureStorage");

const LEDGER_STORAGE_KEY = "AUDIT_LEDGER";

function sanitizeMetadata(metadata) {
  if (metadata === null || metadata === undefined) {
    return {};
  }
  if (typeof metadata !== "object") {
    return { value: metadata };
  }
  return JSON.parse(JSON.stringify(metadata));
}

function loadLedger() {
  return secureStorage.getItem(LEDGER_STORAGE_KEY) || [];
}

function persistLedger(entries) {
  secureStorage.setItem(LEDGER_STORAGE_KEY, entries);
}

function computeHash(payload) {
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function buildEntry({ actor, action, metadata, timestamp, previousHash, id }) {
  const entryWithoutHash = {
    id,
    actor,
    action,
    metadata,
    timestamp,
    previousHash,
  };
  const hash = computeHash(entryWithoutHash);
  return { ...entryWithoutHash, hash };
}

function recordAction(actor, action, metadata = {}) {
  if (!actor || !action) {
    throw new Error("Actor and action are required to record an audit entry");
  }
  const ledger = loadLedger();
  const timestamp = new Date().toISOString();
  const previousHash = ledger.length ? ledger[ledger.length - 1].hash : null;
  const id = `${timestamp}:${ledger.length + 1}`;
  const entry = buildEntry({
    actor,
    action,
    metadata: sanitizeMetadata(metadata),
    timestamp,
    previousHash,
    id,
  });
  ledger.push(entry);
  persistLedger(ledger);
  return entry;
}

function verifyLedger(externalLedger) {
  const ledger = Array.isArray(externalLedger) ? externalLedger : loadLedger();
  const tamperedIndices = [];
  ledger.forEach((entry, index) => {
    const { hash, previousHash } = entry;
    const payload = { ...entry };
    delete payload.hash;
    const expectedHash = computeHash(payload);
    if (hash !== expectedHash) {
      tamperedIndices.push(index);
      return;
    }
    if (index === 0) {
      if (previousHash !== null) {
        tamperedIndices.push(index);
      }
      return;
    }
    const priorHash = ledger[index - 1].hash;
    if (previousHash !== priorHash) {
      tamperedIndices.push(index);
    }
  });
  return { valid: tamperedIndices.length === 0, tamperedIndices };
}

function exportLedgerBundle() {
  const entries = loadLedger();
  const verification = verifyLedger(entries);
  return {
    metadata: {
      bundleId: "AUDIT_LEDGER_BUNDLE",
      version: 1,
      generatedAt: new Date().toISOString(),
      totalEntries: entries.length,
      tamperStatus: verification.valid ? "clean" : "tampered",
      placeholders: {
        organization: "<<ORG>>",
        environment: "<<ENVIRONMENT>>",
        classification: "<<CLASSIFICATION>>",
      },
    },
    entries,
  };
}

function clearLedger() {
  persistLedger([]);
}

module.exports = {
  recordAction,
  verifyLedger,
  exportLedgerBundle,
  loadLedger,
  clearLedger,
};
