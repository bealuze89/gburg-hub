import { useMemo, useState } from "react";

export default function Faq() {
  const items = useMemo(
    () => [
      {
        q: "What is Burg Market?",
        a: "Burg Market is a campus-only marketplace where students can buy, sell, or offer services within the college community.",
      },
      {
        q: "Who can use Burg Market?",
        a: "Students and campus members with a valid school email address.",
      },
      {
        q: "Do I need an account to view listings?",
        a: "No. Browsing listings is public, but posting or contacting sellers requires an account.",
      },
      {
        q: "Why do I need a school email to sign up?",
        a: "To keep the platform limited to the campus community and reduce spam.",
      },
      {
        q: "How do I post an item or service?",
        a: "After verifying your account, you can post listings from the My Listings page.",
      },
      {
        q: "How do I contact a seller?",
        a: "Contact details are visible only to logged-in users.",
      },
      {
        q: "Is Burg Market officially run by the college?",
        a: "No. Burg Market is student-built and not officially affiliated with the college.",
      },
      {
        q: "Does Burg Market guarantee items or services?",
        a: "No. All transactions are between users.",
      },
      {
        q: "What items or services are not allowed?",
        a: "Illegal, unsafe, or misleading listings are not permitted.",
      },
      {
        q: "How do I delete my listing?",
        a: "You can delete your own listings from the My Listings page.",
      },
      {
        q: "Is Burg Market free to use?",
        a: "Yes, Burg Market is completely free.",
      },
      {
        q: "How can I stay safe when buying or selling?",
        a: "Meet in public places, communicate clearly, and avoid sharing sensitive personal information.",
      },
    ],
    []
  );

  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <h1 style={{ margin: 0, fontSize: 24 }}>FAQ</h1>
      <p style={{ margin: 0, opacity: 0.85, maxWidth: 820 }}>
        Simple answers about how Burg Market works.
      </p>

      <div
        style={{
          display: "grid",
          gap: 10,
        }}
      >
        {items.map((item, index) => {
          const isOpen = openIndex === index;
          const buttonId = `faq-btn-${index}`;
          const panelId = `faq-panel-${index}`;

          return (
            <section
              key={item.q}
              style={{
                border: "1px solid var(--gb-border)",
                borderRadius: 12,
                overflow: "hidden",
                background: "var(--gb-surface)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
              }}
            >
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex((prev) => (prev === index ? null : index))}
                style={{
                  width: "100%",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: 14,
                  border: "none",
                  borderRadius: 0,
                  background: "transparent",
                  color: "#111111",
                  cursor: "pointer",
                  fontWeight: 800,
                }}
              >
                <span style={{ lineHeight: 1.25 }}>{item.q}</span>
                <span
                  aria-hidden="true"
                  style={{
                    fontSize: 16,
                    fontWeight: 900,
                    color: "var(--gb-blue)",
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 120ms ease",
                  }}
                >
                  ▾
                </span>
              </button>

              {isOpen ? (
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  style={{
                    padding: "0 14px 14px",
                    borderTop: "1px solid rgba(17, 17, 17, 0.10)",
                  }}
                >
                  <p style={{ margin: "12px 0 0", opacity: 0.92, lineHeight: 1.5 }}>{item.a}</p>
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}
