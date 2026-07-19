import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import Pricing from "../../components/home/Pricing";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#09090B] text-white">
      <Navbar />
      <Pricing />
      <Footer />
    </main>
  );
}