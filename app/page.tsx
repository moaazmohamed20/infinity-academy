import Navbar from "../components/layout/Navbar";

import Hero from "../components/home/Hero";
import Categories from "../components/home/Categories";
import CourseSection from "../components/courses/CourseSection";
import WhyUs from "../components/home/WhyUs";
import LearningPaths from "../components/home/LearningPaths";
import Pricing from "../components/home/Pricing";
import Testimonials from "../components/home/Testimonials";

import Footer from "../components/layout/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#09090B]">
      <Navbar />

      <Hero />

      <Categories />

      <CourseSection />

      <WhyUs />

      <LearningPaths />

      <Pricing />

      <Testimonials />

      <Footer />
    </main>
  );
}