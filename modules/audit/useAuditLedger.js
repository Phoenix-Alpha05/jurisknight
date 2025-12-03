const React = require("react");
const {
  loadLedger,
  verifyLedger,
  recordAction,
  exportLedgerBundle,
} = require("./core");

function useAuditLedger() {
  const { useState, useEffect, useCallback } = React;
  const [entries, setEntries] = useState([]);
  const [status, setStatus] = useState({ valid: true, tamperedIndices: [] });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    const ledger = loadLedger();
    setEntries(ledger);
    setStatus(verifyLedger(ledger));
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addAction = useCallback((actor, action, metadata) => {
    const entry = recordAction(actor, action, metadata);
    setEntries((current) => {
      const nextEntries = [...current, entry];
      setStatus(verifyLedger(nextEntries));
      return nextEntries;
    });
    return entry;
  }, []);

  const exportBundle = useCallback(() => exportLedgerBundle(), []);

  return {
    entries,
    status,
    loading,
    addAction,
    refresh,
    exportBundle,
  };
}

module.exports = { useAuditLedger };
