
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Sfide } from "@/components/Sfide";
import { UnisolSolution } from "@/components/UnisolSolution";
import { Vantaggi } from "@/components/Vantaggi";
import { Integrazioni } from "@/components/Integrazioni";
import { ChiSiamo } from "@/components/ChiSiamo";
import { BusinessPlatform } from "@/components/BusinessPlatform";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Sfide />
      <UnisolSolution />
      <Vantaggi />
      <Integrazioni />
      <ChiSiamo />
      <BusinessPlatform />
      <CTA />
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Index;
