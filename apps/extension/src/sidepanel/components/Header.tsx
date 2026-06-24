export function Header() {
  return (
    <header className="header">
      <div>
        <p className="eyebrow">Preview only - not connected</p>
        <h1>QA Assist</h1>
        <p className="header-copy">Embedded QA command center for Azure DevOps work.</p>
      </div>
      <span className="status-dot" aria-label="Extension shell ready" />
    </header>
  );
}
