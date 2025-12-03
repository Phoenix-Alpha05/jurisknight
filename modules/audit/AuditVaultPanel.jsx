const React = require("react");
const { useAuditLedger } = require("./useAuditLedger");

function AuditVaultPanel({ title = "Audit Vault" }) {
  const { entries, status, loading, exportBundle } = useAuditLedger();
  const [exportPreview, setExportPreview] = React.useState(null);

  const handleExport = React.useCallback(() => {
    const bundle = exportBundle();
    setExportPreview(bundle);
  }, [exportBundle]);

  const sortedEntries = React.useMemo(() => {
    return [...entries].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [entries]);

  if (loading) {
    return (
      <section className="audit-vault" aria-busy="true">
        <p>Loading audit history…</p>
      </section>
    );
  }

  return (
    <section className="audit-vault">
      <header className="audit-vault__header">
        <div>
          <h1>{title}</h1>
          <p className="audit-vault__subtitle">Immutable record of critical actions</p>
        </div>
        <div className="audit-vault__status">
          {status.valid ? (
            <span className="audit-status audit-status--valid">Ledger integrity intact</span>
          ) : (
            <span className="audit-status audit-status--invalid" role="alert">
              Tamper warning: entries {status.tamperedIndices.join(", ")}
            </span>
          )}
        </div>
      </header>

      <div className="audit-vault__actions">
        <button onClick={handleExport} type="button">
          Export JSON
        </button>
      </div>

      <div className="audit-vault__table" data-testid="audit-table">
        {sortedEntries.length === 0 ? (
          <p>No audit activity recorded yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Timestamp</th>
                <th>Hash</th>
              </tr>
            </thead>
            <tbody>
              {sortedEntries.map((entry) => (
                <tr key={entry.id} className="audit-row">
                  <td>{entry.id}</td>
                  <td>{entry.actor}</td>
                  <td>{entry.action}</td>
                  <td>{new Date(entry.timestamp).toLocaleString()}</td>
                  <td className="audit-row__hash">
                    <span title={`Previous hash: ${entry.previousHash || "N/A"}`}>
                      {entry.hash.slice(0, 12)}…
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {sortedEntries.length > 0 && (
        <div className="audit-vault__timeline" data-testid="audit-timeline">
          <h2>Timeline</h2>
          <ol>
            {sortedEntries.map((entry) => (
              <li key={`${entry.id}-timeline`}>
                <strong>{entry.actor}</strong> &mdash; {entry.action}
                <br />
                <small>{new Date(entry.timestamp).toLocaleString()}</small>
              </li>
            ))}
          </ol>
        </div>
      )}

      {exportPreview && (
        <div className="audit-vault__export">
          <h2>Export preview</h2>
          <pre data-testid="audit-export-preview">
            {JSON.stringify(exportPreview, null, 2)}
          </pre>
        </div>
      )}
    </section>
  );
}

module.exports = { AuditVaultPanel };
