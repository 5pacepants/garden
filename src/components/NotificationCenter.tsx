export function NotificationCenter() {
  const items = [
    "Inga försenade uppgifter",
    "Skötsel denna vecka visas här",
    "AI-förslag är avstängt tills API är konfigurerat",
  ];

  return (
    <section className="notification-center" aria-label="Aktuella notiser">
      <div>
        <span className="eyebrow">Aktuellt</span>
        <h2>Den här veckan</h2>
      </div>
      <div className="notification-list">
        {items.map((item) => (
          <span className="notification-pill" key={item}>
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}
