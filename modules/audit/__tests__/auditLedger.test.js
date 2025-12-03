const fs = require("fs");
const path = require("path");

const storageDir = path.join(__dirname, "tmp");
const storagePath = path.join(storageDir, "secure-storage.json");

function loadCore() {
  return require("../core");
}

describe("audit ledger core", () => {
  beforeEach(() => {
    jest.resetModules();
    if (fs.existsSync(storageDir)) {
      fs.rmSync(storageDir, { recursive: true, force: true });
    }
    fs.mkdirSync(storageDir, { recursive: true });
    process.env.AUDIT_SECURE_STORAGE_PATH = storagePath;
  });

  afterAll(() => {
    if (fs.existsSync(storageDir)) {
      fs.rmSync(storageDir, { recursive: true, force: true });
    }
  });

  test("recordAction creates immutable hash chain", () => {
    const core = loadCore();
    core.recordAction("alice", "login", { ip: "1.1.1.1" });
    core.recordAction("system", "sync");
    const ledger = core.loadLedger();

    expect(ledger).toHaveLength(2);
    expect(ledger[0].previousHash).toBeNull();
    expect(ledger[1].previousHash).toBe(ledger[0].hash);
    expect(core.verifyLedger(ledger).valid).toBe(true);
  });

  test("verifyLedger detects tampering", () => {
    const core = loadCore();
    core.recordAction("alice", "login");
    core.recordAction("bob", "approve");

    const ledger = core.loadLedger();
    ledger[1].action = "tampered";
    const verification = core.verifyLedger(ledger);

    expect(verification.valid).toBe(false);
    expect(verification.tamperedIndices).toContain(1);
  });

  test("export bundle contains deterministic metadata placeholders", () => {
    const core = loadCore();
    core.recordAction("system", "seed");

    const bundle = core.exportLedgerBundle();

    expect(bundle.metadata.bundleId).toBe("AUDIT_LEDGER_BUNDLE");
    expect(bundle.metadata.placeholders).toEqual({
      organization: "<<ORG>>",
      environment: "<<ENVIRONMENT>>",
      classification: "<<CLASSIFICATION>>",
    });
    expect(bundle.entries).toHaveLength(1);
  });
});
