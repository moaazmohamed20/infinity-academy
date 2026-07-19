import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import Categories from "../../components/home/Categories";

export default function CategoriesPage() {
  return (
    <main className="min-h-screen bg-[#09090B] text-white">
      <Navbar />
      <Categories />
      <Footer />
    </main>
  );
}