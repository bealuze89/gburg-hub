import { useMemo, useState } from "react";
import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Listings from "./pages/Listings.jsx";
import MyListings from "./pages/MyListings.jsx";
import AuthModal from "./components/AuthModal.jsx";
import { clearToken, getToken } from "./api/api.js";

export default function App() {
  const [token, setTokenState] = useState(() => getToken());
  const [authOpen, setAuthOpen] = useState(false);
  const [authNotice, setAuthNotice] = useState(null);
  const isLoggedIn = useMemo(() => Boolean(token), [token]);

  return (
    <div style={{ width: "100%" }}>
      <Navbar
        isLoggedIn={isLoggedIn}
        onOpenAuth={(notice) => {
          setAuthNotice(typeof notice === "string" && notice.trim() ? notice : null);
          setAuthOpen(true);
        }}
        onLogout={() => {
          clearToken();
          setTokenState(null);
        }}
      />
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: 16, width: "100%" }}>
        <Routes>
          <Route
            path="/"
            element={
              <Listings
                token={token}
                onOpenAuth={(notice) => {
                  setAuthNotice(typeof notice === "string" && notice.trim() ? notice : null);
                  setAuthOpen(true);
                }}
              />
            }
          />
          <Route
            path="/mylistings"
            element={
              <MyListings
                token={token}
                onOpenAuth={(notice) => {
                  setAuthNotice(typeof notice === "string" && notice.trim() ? notice : null);
                  setAuthOpen(true);
                }}
              />
            }
          />
        </Routes>
      </main>

      <AuthModal
        isOpen={authOpen}
        notice={authNotice}
        onClose={() => {
          setAuthOpen(false);
          setAuthNotice(null);
        }}
        onSuccess={(newToken) => {
          setTokenState(newToken);
          setAuthOpen(false);
          setAuthNotice(null);
        }}
      />
    </div>
  );
}
