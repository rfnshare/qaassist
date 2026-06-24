import type { AzureDevOpsPageContext } from "../../adapters/azureDevOpsPageAdapter";

type StoryPanelProps = {
  pageContext: AzureDevOpsPageContext | null;
  status: "checking" | "detected" | "unsupported";
};

export function StoryPanel({ pageContext, status }: StoryPanelProps) {
  if (status === "checking") {
    return (
      <section className="panel" aria-labelledby="story-panel-title">
        <p className="section-label">Story context</p>
        <h2 id="story-panel-title">Checking current page</h2>
        <p className="description">Looking for an Azure DevOps work item URL.</p>
      </section>
    );
  }

  if (!pageContext) {
    return (
      <section className="panel" aria-labelledby="story-panel-title">
        <p className="section-label">Story context</p>
        <h2 id="story-panel-title">Unsupported page</h2>
        <p className="description">Open an Azure DevOps work item page to detect story context.</p>
      </section>
    );
  }

  return (
    <section className="panel" aria-labelledby="story-panel-title">
      <p className="section-label">Story context</p>
      <h2 id="story-panel-title">Azure DevOps work item detected</h2>
      <dl className="context-list">
        <div>
          <dt>Organization</dt>
          <dd>{pageContext.organization}</dd>
        </div>
        <div>
          <dt>Project</dt>
          <dd>{pageContext.project}</dd>
        </div>
        <div>
          <dt>Work item ID</dt>
          <dd>{pageContext.workItemId}</dd>
        </div>
        <div>
          <dt>URL</dt>
          <dd className="breakable">{pageContext.workItemUrl}</dd>
        </div>
        <div>
          <dt>Detected at</dt>
          <dd>{pageContext.detectedAt}</dd>
        </div>
      </dl>
    </section>
  );
}
