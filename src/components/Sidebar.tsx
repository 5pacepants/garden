const navigationItems = [
  "Karta",
  "Växter",
  "Uppgifter",
  "Kalender",
  "Historik",
  "Planering",
  "Inställningar",
];

export function Sidebar() {
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
          <button className={item === "Karta" ? "nav-item active" : "nav-item"} key={item} type="button">
            {item}
          </button>
        ))}
      </nav>
    </aside>
  );
}
