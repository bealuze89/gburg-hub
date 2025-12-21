function truncate(text, maxChars) {
  const value = typeof text === "string" ? text.trim() : "";
  if (!value) return "";
  if (value.length <= maxChars) return value;
  return `${value.slice(0, Math.max(0, maxChars - 1))}…`;
}

function inferContactMethod(value) {
  const v = typeof value === "string" ? value.trim() : "";
  if (!v) return null;
  if (v.startsWith("@")) return "instagram";
  if (v.includes("@") && v.includes(".")) return "email";
  return "phone";
}

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

  // email
  return (
    <svg aria-hidden="true" {...common}>
      <path d="M4 4h16v16H4z" opacity="0" />
      <path d="M4 6h16v12H4z" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg aria-hidden="true" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function ListingCard({ listing, contact, contactMethod, onViewContact, isLoggedIn, onRequireAuth }) {
  const description = truncate(listing.description, 100);
  const price = Number(listing.price);
  const formattedPrice = Number.isFinite(price) ? `$${price.toFixed(2)}` : "";
  const imageUrl = listing.imageUrl || listing.image_url;
  const method = contactMethod || inferContactMethod(contact);
  const status = typeof listing.status === "string" ? listing.status.trim().toLowerCase() : "active";
  const isSold = status === "sold";

  return (
    <article
      style={{
        border: "1px solid var(--gb-border)",
        borderRadius: 12,
        overflow: "hidden",
        background: "var(--gb-surface)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        flexDirection: "column",
        height: "58vh",
        minHeight: 440,
      }}
    >
      <div
        style={{
          position: "relative",
          background: "rgba(31, 79, 163, 0.06)",
          flex: "0 0 38%",
          minHeight: 240,
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={listing.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }}
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
              letterSpacing: 0.2,
            }}
          >
            No photo
          </div>
        )}

        {isSold ? (
          <div
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              padding: "6px 10px",
              borderRadius: 999,
              background: "rgba(17, 17, 17, 0.55)",
              color: "rgba(255,255,255,0.95)",
              fontWeight: 800,
              fontSize: 12,
              letterSpacing: 0.8,
            }}
          >
            SOLD
          </div>
        ) : null}
      </div>

      <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10, overflow: "hidden", flex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: 20, lineHeight: 1.15, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {listing.title}
        </div>

        <div style={{ fontWeight: 800, color: "var(--gb-blue)", fontSize: 18 }}>{formattedPrice}</div>

        <div
          style={{
            opacity: 0.92,
            overflow: "hidden",
            flex: 1,
            minHeight: 0,
            overflowWrap: "anywhere",
            wordBreak: "break-word",
          }}
        >
          {description}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 22 }}>
          <ContactIcon method={method || "email"} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {isSold ? "Sold" : contact ? contact : isLoggedIn ? "Hidden" : "Sign in"}
          </span>
        </div>

        <button
          type="button"
          disabled={isSold}
          onClick={() => {
            if (!isLoggedIn) return onRequireAuth?.();
            if (isSold) return;
            return onViewContact?.(listing.id);
          }}
          style={{ width: "100%", marginTop: 6 }}
        >
          {isSold ? "Sold" : contact ? "Hide contact" : "Contact"}
        </button>
      </div>
    </article>
  );
}
