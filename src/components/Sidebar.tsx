export type AppView = "map" | "plants" | "tasks" | "calendar" | "history" | "planning" | "settings";

const navigationItems: Array<{ id: AppView; label: string }> = [
  { id: "map", label: "Karta" },
  { id: "plants", label: "Växter" },
  { id: "tasks", label: "Uppgifter" },
  { id: "calendar", label: "Kalender" },
  { id: "history", label: "Historik" },
  { id: "planning", label: "Planering" },
  { id: "settings", label: "Inställningar" },
];

type SidebarProps = {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
};

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  return (
    <aside className="sidebar" aria-label="Huvudnavigation">
      <div className="brand">
        <span className="brand-mark">G</span>
        <div>
          <span className="eyebrow">Privat</span>
          <h1>Trädgård</h1>
        </div>
      </div>
      <nav className="nav-list">
        {navigationItems.map((item) => (
          <button
            className={activeView === item.id ? "nav-item active" : "nav-item"}
            key={item.id}
            onClick={() => onViewChange(item.id)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
