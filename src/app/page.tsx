import AnimatedBackgroundClient from '@/components/ui/AnimatedBackgroundClient';
import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import LiveDemoSection from '@/components/landing/LiveDemoSection';
import BeforeAfterSection from '@/components/landing/BeforeAfterSection';
import BusinessValue from '@/components/landing/BusinessValue';
import PainSection from '@/components/landing/PainSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import AnalysisExampleSection from '@/components/landing/AnalysisExampleSection';
import TrustSection from '@/components/landing/TrustSection';
import HowItWorks from '@/components/landing/HowItWorks';
import PricingSection from '@/components/landing/PricingSection';
import Footer from '@/components/landing/Footer';

export default function Home() {
  return (
    <main className="min-h-screen relative z-10">
      <AnimatedBackgroundClient />
      <Navbar />
      <HeroSection />
      <LiveDemoSection />
      <BeforeAfterSection />
      <BusinessValue />
      <PainSection />
      <FeaturesSection />
      <AnalysisExampleSection />
      <TrustSection />
      <HowItWorks />
      <PricingSection />
      <Footer />
    </main>
  );
}
