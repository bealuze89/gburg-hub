import { Link, NavLink } from "react-router-dom";

export default function Navbar({ isLoggedIn, onOpenAuth, onLogout }) {
  return (
    <header>
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <Link
          to="/"
          style={{
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            gap: 10,
            letterSpacing: 0.2,
          }}
        >
          Burg Market
        </Link>

        <nav style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <NavLink to="/" end>
            Listings
          </NavLink>
          <NavLink to="/faq">FAQ</NavLink>
          <NavLink
            to="/mylistings"
            onClick={(e) => {
              if (isLoggedIn) return;
              e.preventDefault();
              onOpenAuth?.("Please sign in to access My Listings.");
            }}
          >
            My Listings
          </NavLink>

          {isLoggedIn ? (
            <button type="button" onClick={onLogout}>
              Logout
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onOpenAuth?.()}
              style={{
                background: "var(--gb-surface)",
                border: "1px solid rgba(17,17,17,0.10)",
                color: "var(--gb-blue)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
              }}
            >
              Login / Register
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
