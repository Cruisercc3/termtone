import { NavBar } from "@/components/nav-bar"
import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"
import { SoundboardSection } from "@/components/soundboard-section"
import { HowItWorksSection } from "@/components/how-it-works-section"
import { FaqSection } from "@/components/faq-section"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      <NavBar />
      <HeroSection />
      <FeaturesSection />
      <SoundboardSection />
      <HowItWorksSection />
      <FaqSection />
      <Footer />
    </main>
  )
}
