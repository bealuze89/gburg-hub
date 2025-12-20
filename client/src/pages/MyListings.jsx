import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { apiCreateListing, apiDeleteListing, apiGetMyListings } from "../api/api.js";

function ContactIcon({ method }) {
  const stroke = "currentColor";
  const common = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };

  if (method === "instagram") {
    return (
      <svg aria-hidden="true" {...common}>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill={stroke} stroke="none" />
      </svg>
    );
  }

  if (method === "phone") {
    return (
      <svg aria-hidden="true" {...common}>
        <path d="M22 16.9v3a2 2 0 0 1-2.2 2 20 20 0 0 1-8.7-3.1 19.6 19.6 0 0 1-6-6A20 20 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .8 2.9a2 2 0 0 1-.5 2.1L8.9 10a16 16 0 0 0 5.1 5.1l1.3-1.3a2 2 0 0 1 2.1-.5c.9.4 1.9.7 2.9.8a2 2 0 0 1 1.7 1.9z" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" {...common}>
      <path d="M4 6h16v12H4z" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function ModalShell({ title, children, onClose }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(31, 79, 163, 0.12)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 60,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: "var(--gb-surface)",
          border: "1px solid var(--gb-border)",
          borderRadius: 12,
          padding: 16,
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>{title}</h2>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <div style={{ marginTop: 12 }}>{children}</div>
      </div>
    </div>
  );
}

export default function MyListings({ token, onOpenAuth }) {
  const location = useLocation();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [contactMethod, setContactMethod] = useState("email");
  const [contactValue, setContactValue] = useState("");
  const [handledDeepLink, setHandledDeepLink] = useState(false);

  async function load() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiGetMyListings(token);
      setListings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load your listings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (handledDeepLink) return;
    const params = new URLSearchParams(location.search || "");
    if (params.get("new") !== "1") return;
    setHandledDeepLink(true);
    openCreate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, token, handledDeepLink]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!token) {
      onOpenAuth?.("Please sign in to post a listing.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (!imageFile) {
        setError("Please attach a photo.");
        return;
      }
      await apiCreateListing(token, {
        title,
        description,
        price: Number(price),
        imageUrl: imageFile,
        contactMethod,
        contactValue: contactMethod === "email" ? undefined : contactValue,
      });
      setTitle("");
      setDescription("");
      setPrice("");
      setImageFile(null);
      setContactMethod("email");
      setContactValue("");
      setCreateOpen(false);
      await load();
    } catch (err) {
      setError(err.message || "Failed to create listing.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await apiDeleteListing(token, id);
      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      setError(err.message || "Failed to delete listing.");
    } finally {
      setBusy(false);
    }
  }

  function requireLoginToPost() {
    if (token) return true;
    onOpenAuth?.("Please sign in to post a listing.");
    return false;
  }

  function openCreate() {
    if (!requireLoginToPost()) return;
    setError(null);
    setCreateOpen(true);
  }


  return (
    <div style={{ display: "grid", gap: 14, position: "relative" }}>
      <h1 style={{ margin: 0, fontSize: 24 }}>My Listings</h1>

      {!token ? <p style={{ margin: 0, opacity: 0.85 }}>Sign in to create and manage your listings.</p> : null}

      {error ? <p style={{ color: "#ffb4b4", margin: 0 }}>{error}</p> : null}
      {loading && token ? <p style={{ margin: 0 }}>Loading...</p> : null}

      <div className="gbTilesGrid">
        {listings.map((l) => (
          <article
            key={l.id}
            style={{
              border: "1px solid var(--gb-border)",
              borderRadius: 12,
              overflow: "hidden",
              background: "var(--gb-surface)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              display: "grid",
              gridTemplateRows: "60% 40%",
              aspectRatio: "1 / 1",
              minHeight: 300,
            }}
          >
            <div style={{ position: "relative", background: "rgba(31, 79, 163, 0.06)" }}>
              {l.imageUrl ? (
                <img
                  src={l.imageUrl}
                  alt={l.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  loading="lazy"
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(17,17,17,0.45)",
                    fontWeight: 600,
                  }}
                >
                  No photo
                </div>
              )}
            </div>

            <div style={{ padding: 12, display: "grid", gap: 8, overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                <div style={{ fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {l.title}
                </div>
                <div style={{ fontWeight: 700, color: "var(--gb-blue)" }}>${Number(l.price).toFixed(2)}</div>
              </div>
              <div style={{ opacity: 0.9, minHeight: 44, overflow: "hidden" }}>{String(l.description || "").slice(0, 120)}{String(l.description || "").length > 120 ? "…" : ""}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "70%",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <ContactIcon method={l.contactMethod || "email"} />
                  <span>{l.contact}</span>
                </div>
                <button type="button" onClick={() => handleDelete(l.id)} disabled={busy || !token}>
                  Delete
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <button
        type="button"
        onClick={openCreate}
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
        }}
        aria-label="Add product"
        title="Add product"
      >
        +
      </button>

      {createOpen ? (
        <ModalShell
          title="Add Product"
          onClose={() => {
            if (busy) return;
            setCreateOpen(false);
          }}
        >
          <form onSubmit={handleCreate} style={{ display: "grid", gap: 10 }}>
            <label>
              Photo (required)
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
            </label>
            <label>
              Title
              <input value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label>
              Description (optional)
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
            </label>
            <label>
              Price
              <input value={price} onChange={(e) => setPrice(e.target.value)} />
            </label>

            <label>
              Contact Method
              <select value={contactMethod} onChange={(e) => setContactMethod(e.target.value)} style={{ width: "100%" }}>
                <option value="email">Email (default)</option>
                <option value="phone">Phone</option>
                <option value="instagram">Instagram</option>
              </select>
            </label>

            {contactMethod === "email" ? (
              <p style={{ margin: 0, opacity: 0.85 }}>Email will use your school email.</p>
            ) : (
              <label>
                {contactMethod === "phone" ? "Phone Number" : "Instagram"}
                <input value={contactValue} onChange={(e) => setContactValue(e.target.value)} />
              </label>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => {
                  if (busy) return;
                  setCreateOpen(false);
                }}
              >
                Cancel
              </button>
              <button type="submit" disabled={busy}>
                {busy ? "Working..." : "Post"}
              </button>
            </div>
          </form>
        </ModalShell>
      ) : null}
    </div>
  );
}
