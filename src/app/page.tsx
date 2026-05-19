import AnimatedBackgroundClient from '@/components/ui/AnimatedBackgroundClient';
import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import BusinessValue from '@/components/landing/BusinessValue';
import PainSection from '@/components/landing/PainSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
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
      <BusinessValue />
      <PainSection />
      <FeaturesSection />
      <TrustSection />
      <HowItWorks />
      <PricingSection />
      <Footer />
    </main>
  );
}
