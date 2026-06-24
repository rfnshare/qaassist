export type PanelKey =
  | "command"
  | "queue"
  | "story"
  | "scope"
  | "manual"
  | "automation"
  | "mail"
  | "settings";

const navItems: Array<{ key: PanelKey; label: string }> = [
  { key: "command", label: "Command Center" },
  { key: "queue", label: "Work Queue" },
  { key: "story", label: "Story Workspace" },
  { key: "scope", label: "Scope & Cases" },
  { key: "manual", label: "Manual Run" },
  { key: "automation", label: "Automation" },
  { key: "mail", label: "Mail" },
  { key: "settings", label: "Settings" }
];

type NavigationProps = {
  activePanel: PanelKey;
  onChange: (panel: PanelKey) => void;
};

export function Navigation({ activePanel, onChange }: NavigationProps) {
  return (
    <nav className="navigation" aria-label="QA Assist sections">
      {navItems.map((item) => (
        <button
          key={item.key}
          className={item.key === activePanel ? "nav-button active" : "nav-button"}
          type="button"
          onClick={() => onChange(item.key)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
