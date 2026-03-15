"use client";

const features = [
  {
    title: "Traffic Intelligence",
    description: "AI-driven congestion detection, emergency vehicle prioritization, and peak-hour prediction.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="7" y="2" width="10" height="20" rx="3" stroke="#4a5568" fill="#1f2937" />
        <circle cx="12" cy="7" r="2.5" fill="#ef4444" stroke="none" />
        <circle cx="12" cy="12" r="2.5" fill="#eab308" stroke="none" />
        <circle cx="12" cy="17" r="2.5" fill="#22c55e" stroke="none" />
      </svg>
    ),
    color: "#4f46e5", // Indigo/Blue
    bgColor: "#eef2ff",
    borderColor: "#e0e7ff",
  },
  {
    title: "Waste Management",
    description: "Citizen reporting with AI image verification. Automated route optimization for collection teams.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </svg>
    ),
    color: "#059669", // Green
    bgColor: "#ecfdf5",
    borderColor: "#d1fae5",
  },
  {
    title: "Infrastructure Monitoring",
    description: "Real-time pipeline pressure tracking, anomaly detection, and predictive maintenance scheduling.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
        <path d="M5 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
      </svg>
    ),
    color: "#0284c7", // Light Blue/Cyan
    bgColor: "#f0f9ff",
    borderColor: "#e0f2fe",
  },
  {
    title: "Energy Demand Prediction",
    description: "Smart grid monitoring, overload alerts, and 24-hour demand forecasting for the power network.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    color: "#d97706", // Amber/Yellow
    bgColor: "#fffbeb",
    borderColor: "#fef3c7",
  },
];

export default function FeaturesSection() {
  return (
    <section style={{ padding: "80px 40px", background: "linear-gradient(180deg, #e0f2f1 0%, #fcfdfc 15%, #fcfdfc 100%)" }}>
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
            gap: "24px",
          }}
        >
          {features.map((feature, index) => (
            <div
              key={index}
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "32px",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
                border: "1px solid #f0f4f0",
                transition: "transform 0.25s ease, box-shadow 0.25s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 12px 30px rgba(0, 0, 0, 0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.04)";
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "14px",
                  background: feature.bgColor,
                  color: feature.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "24px",
                  border: `1px solid ${feature.borderColor}`,
                }}
              >
                {feature.icon}
              </div>
              
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#111827",
                  marginBottom: "12px",
                  letterSpacing: "-0.5px",
                }}
              >
                {feature.title}
              </h3>
              
              <p
                style={{
                  fontSize: "15px",
                  lineHeight: 1.6,
                  color: "#6b7280",
                  margin: 0,
                }}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
