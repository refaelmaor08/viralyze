import AnimatedBackgroundClient from '@/components/ui/AnimatedBackgroundClient';
import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import LiveDemoSection from '@/components/landing/LiveDemoSection';
import BeforeAfterSection from '@/components/landing/BeforeAfterSection';
import FinalCTASection from '@/components/landing/FinalCTASection';
import Footer from '@/components/landing/Footer';

export default function Home() {
  return (
    <main className="min-h-screen relative z-10">
      <AnimatedBackgroundClient />
      <Navbar />
      <HeroSection />
      <LiveDemoSection />
      <BeforeAfterSection />
      <FinalCTASection />
      <Footer />
    </main>
  );
}
