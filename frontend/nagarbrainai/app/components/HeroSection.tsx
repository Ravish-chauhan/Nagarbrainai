"use client";

import Image from "next/image";
export default function HeroSection() {
  return (
    <section
      style={{
        minHeight: "calc(100vh - 80px)",
        display: "flex",
        alignItems: "center",
        padding: "20px 40px 80px",
        position: "relative",
        background: "linear-gradient(160deg, #f5f7f5 0%, #e8f5e9 30%, #f5f7f5 60%, #e0f2f1 100%)",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          width: "100%",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "60px",
          alignItems: "center",
        }}
      >
        {/* Text Content */}
        <div style={{ maxWidth: "800px" }}>
          {/* Heading */}
          <h1
            style={{
              fontSize: "64px",
              fontWeight: 800,
              lineHeight: 1.08,
              color: "#0a1a0a",
              marginBottom: "24px",
              letterSpacing: "-1.5px",
            }}
          >
            Empower Your City{" "}
            <br />
            With Smarter{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #2e7d32, #00c853)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Urban Solutions
            </span>
          </h1>

          {/* Description */}
          <p
            style={{
              fontSize: "19px",
              lineHeight: 1.7,
              color: "#4a5a4a",
              maxWidth: "600px",
              marginBottom: "40px",
            }}
          >
            Streamline municipal operations, manage resources efficiently, and
            make data-driven decisions with our cutting-edge AI platform.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
            <a href="http://localhost:5173" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
              <button
                style={{
                  padding: "18px 40px",
                  borderRadius: "32px",
                  border: "none",
                  cursor: "pointer",
                  background: "linear-gradient(135deg, #1b5e20, #2e7d32)",
                  color: "#fff",
                  fontSize: "18px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  boxShadow: "0 6px 20px rgba(27, 94, 32, 0.3)",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 10px 30px rgba(27, 94, 32, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(27, 94, 32, 0.3)";
                }}
              >
                Discover Our Solutions
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
              </button>
            </a>

            <button
              style={{
                padding: "18px 40px",
                borderRadius: "32px",
                border: "2px solid #1b5e20",
                cursor: "pointer",
                background: "transparent",
                color: "#1b5e20",
                fontSize: "18px",
                fontWeight: 600,
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#e8f5e9";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Watch Demo
            </button>
          </div>
        </div>

        {/* Right Side: Image */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
          <Image
            src="/brainimage.png"
            alt="Isometric Smart City Illustration"
            width={700}
            height={600}
            style={{
              width: "100%",
              maxWidth: "700px",
              height: "auto",
              display: "block",
            }}
            priority
          />
        </div>
      </div>

      {/* Mobile Styles */}
      <style>{`
        @media (max-width: 900px) {
          section > div {
            grid-template-columns: 1fr !important;
            text-align: center;
          }
          section > div > div:last-child {
            order: -1;
          }
        }
      `}</style>
    </section>
  );
}