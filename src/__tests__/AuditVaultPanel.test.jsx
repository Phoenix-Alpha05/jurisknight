const React = require("react");
const { render, screen, fireEvent, waitFor } = require("@testing-library/react");

jest.mock("../../modules/audit/core", () => {
  return {
    loadLedger: jest.fn(),
    verifyLedger: jest.fn(),
    recordAction: jest.fn(),
    exportLedgerBundle: jest.fn(),
  };
});

const auditCore = require("../../modules/audit/core");
const { AuditVaultPanel } = require("../../modules/audit/AuditVaultPanel.jsx");

describe("AuditVaultPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    auditCore.loadLedger.mockReturnValue([]);
    auditCore.verifyLedger.mockReturnValue({ valid: true, tamperedIndices: [] });
    auditCore.exportLedgerBundle.mockReturnValue({
      metadata: { placeholders: {} },
      entries: [],
    });
  });

  test("renders ledger table and timeline", async () => {
    const entries = [
      {
        id: "entry-1",
        actor: "alice",
        action: "login",
        timestamp: new Date("2023-01-01").toISOString(),
        hash: "hash-1",
        previousHash: null,
      },
      {
        id: "entry-2",
        actor: "service",
        action: "issue token",
        timestamp: new Date("2023-01-02").toISOString(),
        hash: "hash-2",
        previousHash: "hash-1",
      },
    ];
    auditCore.loadLedger.mockReturnValue(entries);

    render(<AuditVaultPanel />);

    await waitFor(() => expect(screen.getByTestId("audit-table")).toBeInTheDocument());

    expect(screen.getByText("Ledger integrity intact")).toBeInTheDocument();
    expect(screen.getByText("login")).toBeInTheDocument();
    expect(screen.getByText("Timeline")).toBeInTheDocument();
  });

  test("surfaces tamper warning when verification fails", async () => {
    const entries = [
      {
        id: "entry-1",
        actor: "alice",
        action: "login",
        timestamp: new Date("2023-01-01").toISOString(),
        hash: "hash-1",
        previousHash: null,
      },
    ];
    auditCore.loadLedger.mockReturnValue(entries);
    auditCore.verifyLedger.mockReturnValue({ valid: false, tamperedIndices: [0] });

    render(<AuditVaultPanel />);

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());

    expect(screen.getByText(/Tamper warning/)).toBeInTheDocument();
  });

  test("exports ledger bundle to preview", async () => {
    const bundle = {
      metadata: {
        bundleId: "AUDIT_LEDGER_BUNDLE",
        placeholders: {
          organization: "<<ORG>>",
          environment: "<<ENVIRONMENT>>",
          classification: "<<CLASSIFICATION>>",
        },
      },
      entries: [],
    };
    auditCore.exportLedgerBundle.mockReturnValue(bundle);

    render(<AuditVaultPanel />);

    await waitFor(() => expect(screen.getByTestId("audit-table")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Export JSON"));

    expect(screen.getByTestId("audit-export-preview")).toHaveTextContent("AUDIT_LEDGER_BUNDLE");
    expect(screen.getByTestId("audit-export-preview")).toHaveTextContent("<<ORG>>");
  });
});
