const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DEFAULT_SECRET = "audit-ledger-secret";
const ALGORITHM = "aes-256-gcm";

function resolveStorageFile() {
  const customPath = process.env.AUDIT_SECURE_STORAGE_PATH;
  if (customPath) {
    return customPath;
  }
  return path.join(__dirname, "../../storage/secure-storage.json");
}

const STORAGE_FILE = resolveStorageFile();
const STORAGE_DIR = path.dirname(STORAGE_FILE);

function getMasterKey() {
  const secret = process.env.AUDIT_SECURE_STORAGE_SECRET || DEFAULT_SECRET;
  return crypto.createHash("sha256").update(secret).digest();
}

function ensureStorageFile() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORAGE_FILE)) {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify({}), "utf8");
  }
}

function readStore() {
  ensureStorageFile();
  const content = fs.readFileSync(STORAGE_FILE, "utf8").trim();
  if (!content) {
    return {};
  }
  try {
    return JSON.parse(content);
  } catch (error) {
    return {};
  }
}

function writeStore(store) {
  ensureStorageFile();
  fs.writeFileSync(STORAGE_FILE, JSON.stringify(store, null, 2), "utf8");
}

function encryptPayload(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getMasterKey(), iv);
  const json = Buffer.from(JSON.stringify(value), "utf8");
  const encrypted = Buffer.concat([cipher.update(json), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString("base64"),
    content: encrypted.toString("base64"),
    tag: tag.toString("base64"),
  };
}

function decryptPayload(payload) {
  const { iv, content, tag } = payload;
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getMasterKey(),
    Buffer.from(iv, "base64")
  );
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(content, "base64")),
    decipher.final(),
  ]);
  return JSON.parse(decrypted.toString("utf8"));
}

function setItem(key, value) {
  const store = readStore();
  store[key] = encryptPayload(value);
  writeStore(store);
}

function getItem(key) {
  const store = readStore();
  if (!store[key]) {
    return null;
  }
  try {
    return decryptPayload(store[key]);
  } catch (error) {
    return null;
  }
}

function clearAll() {
  ensureStorageFile();
  fs.writeFileSync(STORAGE_FILE, JSON.stringify({}), "utf8");
}

module.exports = {
  getItem,
  setItem,
  clearAll,
  __internal: {
    STORAGE_FILE,
  },
};
