export function StatusCard() {
  return (
    <section className="status-card" aria-label="Extension status">
      <div>
        <p className="section-label">Status</p>
        <h2>Extension shell ready</h2>
      </div>
      <p>
        The side panel UI is available. Azure DevOps, backend, LLM, and QA analysis
        features are intentionally not connected yet.
      </p>
    </section>
  );
}
