import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ListingCard from "../components/ListingCard.jsx";
import { apiGetListingContact, apiGetListings } from "../api/api.js";

export default function Listings({ token, onOpenAuth }) {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contactById, setContactById] = useState({});

  const isLoggedIn = Boolean(token);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiGetListings();
        if (!cancelled) setListings(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load listings.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleViewContact(listingId) {
    if (!token) {
      onOpenAuth?.();
      return;
    }
    try {
      const res = await apiGetListingContact(token, listingId);
      setContactById((prev) => ({
        ...prev,
        [listingId]: {
          contact: res?.contact || "",
          contactMethod: res?.contactMethod || null,
        },
      }));
    } catch (err) {
      setError(err.message || "Failed to fetch contact.");
    }
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <h1 style={{ margin: 0, fontSize: 24 }}>Listings</h1>

      {loading ? <p>Loading...</p> : null}
      {error ? <p style={{ color: "#ffb4b4" }}>{error}</p> : null}

      <div className="gbTilesGrid">
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            contact={contactById[listing.id]?.contact}
            contactMethod={contactById[listing.id]?.contactMethod}
            isLoggedIn={isLoggedIn}
            onRequireAuth={() => onOpenAuth?.()}
            onViewContact={handleViewContact}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => {
          if (!token) return onOpenAuth?.("Please sign in to post a listing.");
          navigate("/mylistings?new=1");
        }}
        style={{
          position: "fixed",
          right: 18,
          bottom: 18,
          width: 56,
          height: 56,
          borderRadius: 999,
          padding: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          fontWeight: 900,
          background: "rgba(31, 79, 163, 0.12)",
          zIndex: 40,
        }}
        aria-label="Add product"
        title="Add product"
      >
        +
      </button>
    </div>
  );
}
