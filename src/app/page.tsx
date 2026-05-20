import AnimatedBackgroundClient from '@/components/ui/AnimatedBackgroundClient';
import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
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
      <LiveDemoSection />
      <BeforeAfterSection />
      <BusinessValueSection />
      <PricingSection />
      <Footer />
    </main>
  );
}
