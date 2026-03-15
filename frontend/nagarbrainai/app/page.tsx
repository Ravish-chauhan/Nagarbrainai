import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import FeaturesSection from "./components/FeaturesSection";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <main style={{ marginTop: "80px", flex: 1 }}>
        <HeroSection />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
}
