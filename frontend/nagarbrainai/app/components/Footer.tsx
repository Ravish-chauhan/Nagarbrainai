"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer
      style={{
        background: "#0a1a0a", // Very dark green/black
        color: "#e8efe8",
        padding: "80px 40px 30px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          width: "100%",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "40px",
          marginBottom: "60px",
        }}
      >
        {/* Brand Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #2e7d32, #66bb6a)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span style={{ fontSize: "22px", fontWeight: 700, color: "#ffffff", letterSpacing: "-0.5px" }}>
              NagarBrain AI
            </span>
          </div>
          <p style={{ color: "#9aa99a", fontSize: "15px", lineHeight: 1.6, maxWidth: "280px" }}>
            Building smarter, safer, and more sustainable cities through cutting-edge AI orchestration.
          </p>
          
          <div style={{ display: "flex", gap: "16px", marginTop: "10px" }}>
            {/* Social Icons (using simple SVGs placeholders) */}
            {[
              { name: "Twitter", path: "M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" },
              { name: "LinkedIn", path: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z M2 9h4v12H2z M4 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" },
              { name: "GitHub", path: "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" },
            ].map((social) => (
              <a 
                key={social.name} 
                href="#" 
                style={{
                  width: "40px", 
                  height: "40px", 
                  borderRadius: "50%", 
                  background: "#162816", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  color: "#9aa99a",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#2e7d32";
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#162816";
                  e.currentTarget.style.color = "#9aa99a";
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={social.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* Links: Solutions */}
        <div>
          <h4 style={{ color: "#ffffff", fontSize: "16px", fontWeight: 600, marginBottom: "20px" }}>Solutions</h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
            {["Traffic Intelligence", "Waste Management", "Infrastructure Monitoring", "Energy Grid AI", "Emergency Response"].map((item) => (
              <li key={item}>
                <Link 
                  href="#"
                  style={{ color: "#9aa99a", textDecoration: "none", fontSize: "15px", transition: "color 0.2s" }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "#9aa99a"}
                >
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Links: Company */}
        <div>
          <h4 style={{ color: "#ffffff", fontSize: "16px", fontWeight: 600, marginBottom: "20px" }}>Company</h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
            {["About Us", "Careers", "Partnerships", "News & Blog", "Contact Us"].map((item) => (
              <li key={item}>
                <Link 
                  href="#"
                  style={{ color: "#9aa99a", textDecoration: "none", fontSize: "15px", transition: "color 0.2s" }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "#9aa99a"}
                >
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Newsletter / Contact */}
        <div>
          <h4 style={{ color: "#ffffff", fontSize: "16px", fontWeight: 600, marginBottom: "20px" }}>Stay Updated</h4>
          <p style={{ color: "#9aa99a", fontSize: "14px", lineHeight: 1.5, marginBottom: "16px" }}>
            Subscribe to our newsletter for the latest smart city insights.
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            <input 
              type="email" 
              placeholder="Enter your email" 
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: "8px",
                border: "1px solid #2a3a2a",
                background: "#162816",
                color: "#ffffff",
                fontSize: "14px",
                outline: "none"
              }}
            />
            <button
              style={{
                padding: "0 20px",
                borderRadius: "8px",
                border: "none",
                background: "#2e7d32",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#388e3c"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#2e7d32"}
            >
              Subscribe
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div 
        style={{ 
          maxWidth: "1280px", 
          margin: "0 auto", 
          width: "100%", 
          borderTop: "1px solid #2a3a2a", 
          paddingTop: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px"
        }}
      >
        <p style={{ color: "#7a8a7a", fontSize: "14px", margin: 0 }}>
          © {new Date().getFullYear()} NagarBrain AI. All rights reserved.
        </p>
        <div style={{ display: "flex", gap: "24px" }}>
          <Link href="#" style={{ color: "#7a8a7a", textDecoration: "none", fontSize: "14px" }}>Privacy Policy</Link>
          <Link href="#" style={{ color: "#7a8a7a", textDecoration: "none", fontSize: "14px" }}>Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
