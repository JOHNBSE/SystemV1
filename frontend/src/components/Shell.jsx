export default function Shell({ user, tabs, tab, onTab, onLogout, children }) {
  return (
    <>
      <header className="bar">
        <span className="brand">RentDesk</span>
        <nav className="tabs">
          {tabs.map((t) => (
            <button key={t} className={t === tab ? 'on' : ''} onClick={() => onTab(t)}>{t}</button>
          ))}
        </nav>
        <div className="who"><b>{user.name}</b>{user.role}</div>
        <button className="btn-sm" onClick={onLogout}>Log out</button>
      </header>
      <main>{children}</main>
    </>
  );
}
