import AnimatedBackgroundClient from '@/components/ui/AnimatedBackgroundClient';
import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import HowItWorks from '@/components/landing/HowItWorks';
import LiveDemoSection from '@/components/landing/LiveDemoSection';
import BeforeAfterSection from '@/components/landing/BeforeAfterSection';
import BusinessValueSection from '@/components/landing/BusinessValueSection';
import PricingSection from '@/components/landing/PricingSection';
import Footer from '@/components/landing/Footer';

export default function Home() {
  return (
    <main className="min-h-screen relative z-10">
      <AnimatedBackgroundClient />
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <LiveDemoSection />
      <BeforeAfterSection />
      <BusinessValueSection />
      <PricingSection />
      <Footer />
    </main>
  );
}
