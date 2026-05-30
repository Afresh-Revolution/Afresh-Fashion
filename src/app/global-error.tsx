"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#f5f5f0",
          fontFamily: "system-ui, sans-serif",
          padding: "2rem",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "28rem" }}>
          <h1 style={{ fontSize: "1.25rem", letterSpacing: "0.2em", marginBottom: "0.75rem" }}>
            SOMETHING WENT WRONG
          </h1>
          <p style={{ color: "#888", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
            Please try again. If the problem continues, refresh the page.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              background: "#c9a962",
              color: "#0a0a0a",
              border: "none",
              padding: "0.75rem 1.5rem",
              cursor: "pointer",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontSize: "0.7rem",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
