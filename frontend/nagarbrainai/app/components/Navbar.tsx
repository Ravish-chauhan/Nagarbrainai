"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const navItems = ["Home", "Features", "Report issues", "Analytics", "Contact us"];

const featuresDropdown = [
  "Traffic Management",
  "Water Complaint & Management",
  "Waste Management",
  "Energy Monitoring",
];

export default function Navbar() {
  const [active, setActive] = useState("Home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const isNowMobile = window.innerWidth < 768;
      setIsMobile(isNowMobile);
      if (!isNowMobile) {
        setMenuOpen(false);
        setFeaturesOpen(false);
      }
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <nav
      style={{
        width: "100%",
        height: "80px",
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: isMobile ? "0 20px" : "0 40px",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 50,
        borderBottom: "1px solid #e8efe8",
        boxShadow: "0 1px 8px rgba(0, 0, 0, 0.06)",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Image src="/images/logo.png" alt="NagarBrain AI Logo" width={64} height={64} style={{ borderRadius: "10px" }} />
        <span
          style={{
            fontSize: "18px",
            fontWeight: 700,
            color: "#0d2818",
            letterSpacing: "-0.3px",
            whiteSpace: "nowrap",
          }}
        >
          NagarBrain AI
        </span>
      </div>

      {/* Desktop Nav Links */}
      {!isMobile && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {navItems.map((item) => {
            const isActive = active === item;
            const hasDropdown = item === "Features";

            return (
              <div
                key={item}
                style={{ position: "relative" }}
                onMouseEnter={(e) => {
                  const dd = e.currentTarget.querySelector("[data-dropdown]") as HTMLElement;
                  if (dd) { dd.style.opacity = "1"; dd.style.visibility = "visible"; dd.style.transform = "translateX(-50%) translateY(0)"; }
                }}
                onMouseLeave={(e) => {
                  const dd = e.currentTarget.querySelector("[data-dropdown]") as HTMLElement;
                  if (dd) { dd.style.opacity = "0"; dd.style.visibility = "hidden"; dd.style.transform = "translateX(-50%) translateY(8px)"; }
                }}
              >
                <button
                  onClick={() => setActive(item)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    background: "transparent",
                    color: isActive ? "#0d3b12" : "#1a1a1a",
                    fontSize: "18px",
                    fontWeight: 600,
                    letterSpacing: "0.5px",
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#0d3b12"; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = "#1a1a1a"; }}
                >
                  {item}
                  {hasDropdown && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  )}
                </button>

                {hasDropdown && (
                  <div
                    data-dropdown
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: "50%",
                      transform: "translateX(-50%) translateY(8px)",
                      marginTop: "8px",
                      background: "#ffffff",
                      borderRadius: "12px",
                      boxShadow: "0 10px 40px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)",
                      border: "1px solid #e8efe8",
                      padding: "8px",
                      minWidth: "260px",
                      opacity: 0,
                      visibility: "hidden" as const,
                      transition: "all 0.25s ease",
                      zIndex: 100,
                    }}
                  >
                    {featuresDropdown.map((subItem) => (
                      <button
                        key={subItem}
                        onClick={() => setActive(subItem)}
                        style={{
                          display: "block",
                          width: "100%",
                          padding: "12px 16px",
                          borderRadius: "8px",
                          border: "none",
                          cursor: "pointer",
                          background: active === subItem ? "#e8f5e9" : "transparent",
                          color: active === subItem ? "#1b5e20" : "#3a4a3a",
                          fontSize: "16px",
                          fontWeight: 500,
                          textAlign: "left" as const,
                          transition: "all 0.15s ease",
                          whiteSpace: "nowrap",
                        }}
                        onMouseEnter={(e) => { if (active !== subItem) { e.currentTarget.style.background = "#f0f7f0"; e.currentTarget.style.color = "#1b5e20"; } }}
                        onMouseLeave={(e) => { if (active !== subItem) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#3a4a3a"; } }}
                      >
                        {subItem}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Desktop: View Dashboard Button */}
      {!isMobile && (
        <a href="http://localhost:5173" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
          <button
            style={{
              padding: "14px 32px",
              borderRadius: "28px",
              border: "none",
              cursor: "pointer",
              background: "linear-gradient(135deg, #1b5e20, #2e7d32)",
              color: "#ffffff",
              fontSize: "16px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 14px rgba(27, 94, 32, 0.3)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 6px 20px rgba(27, 94, 32, 0.45)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 4px 14px rgba(27, 94, 32, 0.3)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            View Dashboard
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </a>
      )}

      {/* Mobile: Hamburger Button */}
      {isMobile && (
        <button
          onClick={() => { setMenuOpen(!menuOpen); if (menuOpen) setFeaturesOpen(false); }}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "8px",
            display: "flex",
            flexDirection: "column",
            gap: menuOpen ? "0px" : "5px",
            justifyContent: "center",
            alignItems: "center",
            width: "40px",
            height: "40px",
          }}
        >
          <span style={{
            display: "block", width: "24px", height: "2.5px", borderRadius: "2px",
            background: "#0d2818", transition: "all 0.3s ease",
            transform: menuOpen ? "rotate(45deg) translateY(1px)" : "none",
          }} />
          {!menuOpen && <span style={{
            display: "block", width: "24px", height: "2.5px", borderRadius: "2px",
            background: "#0d2818", transition: "all 0.3s ease",
          }} />}
          <span style={{
            display: "block", width: "24px", height: "2.5px", borderRadius: "2px",
            background: "#0d2818", transition: "all 0.3s ease",
            transform: menuOpen ? "rotate(-45deg) translateY(-1px)" : "none",
          }} />
        </button>
      )}

      {/* Mobile: Slide-down Menu */}
      {isMobile && (
        <div
          style={{
            position: "absolute",
            top: "80px",
            left: 0,
            width: "100%",
            background: "#ffffff",
            borderBottom: menuOpen ? "1px solid #e8efe8" : "none",
            boxShadow: menuOpen ? "0 8px 24px rgba(0, 0, 0, 0.1)" : "none",
            maxHeight: menuOpen ? "500px" : "0",
            overflow: "hidden",
            transition: "max-height 0.35s ease, box-shadow 0.3s ease",
            zIndex: 49,
          }}
        >
          <div style={{ padding: "8px 20px 16px" }}>
            {navItems.map((item) => {
              const isActive = active === item;
              const hasDropdown = item === "Features";

              return (
                <div key={item}>
                  <button
                    onClick={() => {
                      if (hasDropdown) {
                        setFeaturesOpen(!featuresOpen);
                      } else {
                        setActive(item);
                        setMenuOpen(false);
                        setFeaturesOpen(false);
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      padding: "14px 16px",
                      borderRadius: "8px",
                      border: "none",
                      cursor: "pointer",
                      background: isActive ? "#e8f5e9" : "transparent",
                      color: isActive ? "#1b5e20" : "#3a4a3a",
                      fontSize: "18px",
                      fontWeight: 600,
                      textAlign: "left" as const,
                      transition: "all 0.15s ease",
                    }}
                  >
                    {item}
                    {hasDropdown && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        style={{ transition: "transform 0.2s ease", transform: featuresOpen ? "rotate(180deg)" : "rotate(0)" }}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    )}
                  </button>

                  {/* Mobile Features Sub-menu */}
                  {hasDropdown && (
                    <div
                      style={{
                        maxHeight: featuresOpen ? "300px" : "0",
                        overflow: "hidden",
                        transition: "max-height 0.3s ease",
                        paddingLeft: "16px",
                      }}
                    >
                      {featuresDropdown.map((subItem) => (
                        <button
                          key={subItem}
                          onClick={() => { setActive(subItem); setMenuOpen(false); setFeaturesOpen(false); }}
                          style={{
                            display: "block",
                            width: "100%",
                            padding: "12px 16px",
                            borderRadius: "8px",
                            border: "none",
                            cursor: "pointer",
                            background: active === subItem ? "#e8f5e9" : "transparent",
                            color: active === subItem ? "#1b5e20" : "#5a6b5a",
                            fontSize: "16px",
                            fontWeight: 500,
                            textAlign: "left" as const,
                            transition: "all 0.15s ease",
                          }}
                        >
                          {subItem}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Mobile: View Dashboard Button */}
            <a href="http://localhost:5173" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block", marginTop: "12px" }}>
              <button
                onClick={() => setMenuOpen(false)}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "12px",
                  border: "none",
                  cursor: "pointer",
                  background: "linear-gradient(135deg, #1b5e20, #2e7d32)",
                  color: "#ffffff",
                  fontSize: "16px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 4px 14px rgba(27, 94, 32, 0.3)",
                }}
              >
                View Dashboard
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
