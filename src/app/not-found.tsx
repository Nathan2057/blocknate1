import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#06080F",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        padding: "24px",
        fontFamily: "Inter, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background gradient */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "60%",
          background: "radial-gradient(ellipse 80% 60% at 50% -5%, rgba(0,102,255,0.15) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(28,34,54,0.8) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          pointerEvents: "none",
          opacity: 0.5,
        }}
      />

      {/* Content */}
      <div style={{ position: "relative", textAlign: "center" }}>
        {/* 404 number */}
        <div
          style={{
            fontSize: "8rem",
            fontWeight: 900,
            lineHeight: 1,
            marginBottom: 8,
            background: "linear-gradient(135deg, #0066FF, #00C896)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          404
        </div>

        <h1
          style={{
            color: "#FFFFFF",
            fontWeight: 700,
            fontSize: "1.4rem",
            marginBottom: 10,
          }}
        >
          Page Not Found
        </h1>

        <p
          style={{
            color: "#8892A4",
            fontSize: "0.88rem",
            maxWidth: 360,
            margin: "0 auto 32px",
            lineHeight: 1.6,
          }}
        >
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/dashboard"
            style={{
              background: "#0066FF",
              color: "#fff",
              padding: "10px 24px",
              borderRadius: 3,
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "0.88rem",
            }}
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            style={{
              background: "transparent",
              color: "#8892A4",
              padding: "10px 24px",
              borderRadius: 3,
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "0.88rem",
              border: "1px solid #1C2236",
            }}
          >
            Home
          </Link>
        </div>

        {/* Brand */}
        <div style={{ marginTop: 48 }}>
          <Link
            href="/"
            style={{ textDecoration: "none", fontWeight: 900, fontSize: "1rem", letterSpacing: "-0.02em" }}
          >
            <span style={{ color: "#FFFFFF" }}>BLOCK</span>
            <span style={{ color: "#0066FF" }}>NATE</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
