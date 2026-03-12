import LandingNav from "@/components/landing/LandingNav";
import HeroSection from "@/components/landing/HeroSection";
import TickerStrip from "@/components/landing/TickerStrip";
import FeaturesSection from "@/components/landing/FeaturesSection";
import SignalPreview from "@/components/landing/SignalPreview";
import HowItWorks from "@/components/landing/HowItWorks";
import ToolsPreview from "@/components/landing/ToolsPreview";
import CTABanner from "@/components/landing/CTABanner";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main style={{ backgroundColor: "#06080F", minHeight: "100vh", overflowX: "hidden" }}>
      <LandingNav />
      <HeroSection />
      <TickerStrip />
      <FeaturesSection />
      <SignalPreview />
      <HowItWorks />
      <ToolsPreview />
      <CTABanner />
      <Footer />
    </main>
  );
}
