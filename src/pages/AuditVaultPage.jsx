const React = require("react");
const { AuditVaultPanel } = require("../../modules/audit/AuditVaultPanel.jsx");

function AuditVaultPage() {
  return (
    <main className="audit-vault-page">
      <AuditVaultPanel />
    </main>
  );
}

module.exports = { AuditVaultPage };
